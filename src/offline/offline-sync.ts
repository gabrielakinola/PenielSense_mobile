import { AxiosError } from 'axios';
import { careHomeApiClient, normalizeApiError } from '@/src/lib/api-client';
import { markOfflineMutationFailed, pendingOfflineMutations, removeOfflineMutation, type OfflineMutation } from './offline-db';
import { prepareQueuedCareEntry } from './prepare-care-entry';
export const MAX_OFFLINE_AUTO_ATTEMPTS = 3;
export const mutationNeedsAttention = (item: OfflineMutation) => item.attempts >= MAX_OFFLINE_AUTO_ATTEMPTS;
export function describeOfflineMutation(item: Pick<OfflineMutation,'method'|'url'>) { if(item.url.includes('/care-entries')) return item.method==='POST'?'Care note':'Care note update'; if(item.url.includes('/care-tasks')&&item.url.includes('/outcome')) return 'Task outcome'; if(item.url.includes('/incidents')) return 'Incident report'; return `${item.method} ${item.url}`; }
function permanent(error:unknown){ if(error instanceof AxiosError&&error.response){const s=error.response.status; return s>=400&&s<500&&![408,425,429].includes(s)} return false }
let flushing=false;
export async function flushOfflineQueue(ownerId:string){ if(flushing)return{synced:0,skipped:0};flushing=true;let synced=0,skipped=0;try{for(const item of await pendingOfflineMutations(ownerId)){if(mutationNeedsAttention(item)){skipped++;continue}try{const payload=item.method==='POST'&&item.url.endsWith('/care-entries')?await prepareQueuedCareEntry(item.url,item.payload):item.payload;await careHomeApiClient.request({method:item.method,url:item.url,data:payload,headers:{'Idempotency-Key':item.id}});await removeOfflineMutation(item.id);synced++}catch(error){const isPermanent=permanent(error);await markOfflineMutationFailed(item.id,normalizeApiError(error),isPermanent);if(!isPermanent)break}}}finally{flushing=false}return{synced,skipped}}
