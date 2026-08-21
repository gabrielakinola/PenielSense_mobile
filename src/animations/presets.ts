import { FadeInDown } from 'react-native-reanimated';

export { FadeIn, FadeInUp, FadeInDown, ZoomIn } from 'react-native-reanimated';
export { FadeIn as fadeIn, FadeInUp as fadeInUp, FadeInDown as fadeInDown, ZoomIn as scaleIn } from 'react-native-reanimated';

export function listItemEnter(index: number) {
  return FadeInDown.delay(index * 60)
    .duration(400)
    .springify()
    .damping(20);
}
