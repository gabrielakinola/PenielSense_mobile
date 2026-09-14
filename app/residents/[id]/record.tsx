import { Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ContactRound, FileCheck2, Languages, Scale, ShieldCheck, UsersRound } from "lucide-react-native";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { Card } from "@/src/components/ui/Card";
import { SkeletonCard } from "@/src/components/ui/Skeleton";
import { getResidentCareProfile } from "@/src/services/residents.api";
import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { typography } from "@/src/theme/typography";

export default function ResidentRecordScreen() {
  const { id = "" } = useLocalSearchParams<{ id: string }>(); const colors = useThemeColors();
  const query = useQuery({ queryKey: ["carehome", "resident-profile", id], queryFn: () => getResidentCareProfile(id), enabled: !!id }); const p = query.data;
  const section = (icon: typeof ContactRound, title: string, rows: Array<[string,string]>) => { const Icon=icon; const visible=rows.filter(([,value]) => value); return <Card style={{ marginBottom: 12 }}><View style={{ flexDirection:"row",alignItems:"center",gap:9 }}><Icon size={19} color={colors.primary}/><Text style={{ ...typography.heading,color:colors.text }}>{title}</Text></View>{visible.length ? visible.map(([label,value]) => <View key={label} style={{ marginTop:12 }}><Text style={{ ...typography.label,color:colors.secondary }}>{label.toUpperCase()}</Text><Text style={{ ...typography.body,color:colors.text,marginTop:3 }}>{value}</Text></View>) : <Text style={{ ...typography.caption,color:colors.secondary,marginTop:10 }}>Nothing recorded yet.</Text>}</Card>; };
  return <><Stack.Screen options={{ title:"Profile and legal record" }}/><ScreenContainer><Text style={{ ...typography.title,color:colors.text }}>Profile and legal record</Text><Text style={{ ...typography.caption,color:colors.secondary,marginTop:4,marginBottom:16 }}>Read the resident’s current preferences, contacts and authorisations.</Text>{query.isLoading || !p ? <SkeletonCard lines={6}/> : <>
    {section(Languages,"Communication and culture",[["Preferred name",p.preferredName],["Language",p.preferredLanguage],["Communication",p.communicationNeeds],["Religion and culture",p.religionCulture],["Advocacy",p.advocacySupport]])}
    {section(UsersRound,"Contacts and GP",[["GP",[p.gpName,p.gpPractice].filter(Boolean).join(" · ")],...p.contacts.map((contact) => [contact.name,`${contact.relationship}${contact.phone ? ` · ${contact.phone}` : ""}${contact.nextOfKin ? " · Next of kin" : ""}${contact.hasHealthWelfareLpa ? " · Health & welfare LPA" : ""}`] as [string,string])])}
    {section(Scale,"Capacity decisions",[["Overview",p.capacitySummary],...p.capacityDecisions.map((item) => [item.decision,`${item.outcome.replaceAll("_"," ")}${item.bestInterestDecision ? ` · ${item.bestInterestDecision}` : ""}`] as [string,string])])}
    {section(FileCheck2,"Consent",[["Overview",p.consentSummary],...p.consentRecords.map((item) => [item.scope,`${item.status.replaceAll("_"," ")}${item.givenBy ? ` · ${item.givenBy}` : ""}`] as [string,string])])}
    {section(ShieldCheck,"DoLS and DNACPR",[["DoLS",`${p.dols.status.replaceAll("_"," ")}${p.dols.expiresAt ? ` · expires ${new Date(p.dols.expiresAt).toLocaleDateString("en-GB")}` : ""}`],["Conditions",p.dols.conditions ?? p.dolsSummary],["DNACPR",`${p.dnacprStatus}${p.dnacprDocumentLocation ? ` · ${p.dnacprDocumentLocation}` : ""}`]])}
  </>}</ScreenContainer></>;
}
