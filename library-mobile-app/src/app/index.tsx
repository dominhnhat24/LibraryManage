import { Redirect, type RelativePathString } from 'expo-router';

export default function IndexScreen() {
  return <Redirect href={'/auth/login' as RelativePathString} />;
}
