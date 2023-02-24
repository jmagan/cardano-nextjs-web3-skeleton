import { FaUser } from "react-icons/fa";
import WalletButton from "@/components/WalletButton";
import { useRouter } from "next/router";
import { Icon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Spacer,
} from "@chakra-ui/react";
import React from "react";
import { useWallet } from "@meshsdk/react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { connected } = useWallet();

  return (
    <>
      <Heading
        size="lg"
        width="100%"
        textAlign="center"
        mt="2"
        position="absolute"
        zIndex="-1"
      >
        <Link href="/">Cardano Web3</Link>
      </Heading>
      <Flex alignItems="center" p="2" h="60px">
        <Button onClick={() => router.push("/protected")} me="2">
          Protected
        </Button>
        <Button onClick={() => router.push("/admin/users")} me="2">
          Admin
        </Button>
        <Spacer />
        {connected && (
          <>
            {status === "unauthenticated" && (
              <>
                <Button onClick={() => router.push("/signup")} me="2">
                  Sign up
                </Button>
                <Button onClick={() => router.push("/signin")} me="2">
                  Sign in
                </Button>
              </>
            )}
            {status === "authenticated" && (
              <Link href="/profile">
                <Center
                  borderRadius="10px"
                  backgroundColor="gray.100"
                  me="2"
                  h="40px"
                  p="4"
                >
                  <Box>
                    <Icon as={FaUser} /> {session.user?.name}
                  </Box>
                </Center>
              </Link>
            )}
          </>
        )}
        <WalletButton />
      </Flex>
      <main>{children}</main>
    </>
  );
}
