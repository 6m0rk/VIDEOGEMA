import '../styles/globals.css';
import Link from 'next/link';
import { Text, ThemeProvider, Flex, Box, Input } from 'theme-ui';
//import theme from "@theme-ui/preset-dark";
import theme from '@theme-ui/preset-system';

const dark = {
  ...theme,
  styles: {
    ...theme,
  },
};

function Marketplace({ Component, pageProps }) {
  return (
    <ThemeProvider theme={dark}>
      <Flex sx={{ flexDirection: 'column', p: 4 }}>
        <Text className="text-4xl font-bold">VIDEOGEMA</Text>
        <Flex
          as="nav"
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 4,
            borderBottom: '1px solid background',
          }}
        >
          <div className="flex mt-4">
            <Link href="/" passHref>
              <Text as="a" variant="heading" sx={{ mr: 3, color: 'secondary' }}>
                Dashboard
              </Text>
            </Link>
            <Link href="/create-item" passHref>
              <Text as="a" variant="heading" sx={{ mr: 3, color: 'secondary' }}>
                Mint
              </Text>
            </Link>
            <Link href="/my-assets" passHref>
              <Text as="a" variant="heading" sx={{ mr: 3, color: 'secondary' }}>
                My NFTs
              </Text>
            </Link>
            <Link href="/creator-dashboard" passHref>
              <Text as="a" variant="heading" sx={{ mr: 3, color: 'secondary' }}>
                Profile
              </Text>
            </Link>
          </div>
          <Input placeholder="Search..." sx={{ width: 250 }} />
        </Flex>
        <Component {...pageProps} />
      </Flex>
    </ThemeProvider>
  );
}

export default Marketplace;
