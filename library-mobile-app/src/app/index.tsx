// Route gốc được guard chuyển sang danh mục hoặc màn hình xác thực.
import { Redirect } from 'expo-router';

export default function IndexScreen() {
  return <Redirect href={'/catalog' as never} />;
}
