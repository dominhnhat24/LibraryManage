// Mở liên kết ngoài trong trình duyệt nhúng trên thiết bị và giữ hành vi liên kết chuẩn trên web.
import { Href, Link } from 'expo-router';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { type ComponentProps } from 'react';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: Href & string };

// Liên kết ngoài mở trong trình duyệt nhúng trên native và trong tab mới trên web.
export function ExternalLink({ href, ...rest }: Props) {
  // Ngăn điều hướng mặc định trên native để chuyển URL sang trình duyệt trong ứng dụng.
  return (
    <Link
      target="_blank"
      {...rest}
      href={href}
      onPress={async (event) => {
        if (process.env.EXPO_OS !== 'web') {
          // Prevent the default behavior of linking to the default browser on native.
          event.preventDefault();
          // Open the link in an in-app browser.
          await openBrowserAsync(href, {
            presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
          });
        }
      }}
    />
  );
}
