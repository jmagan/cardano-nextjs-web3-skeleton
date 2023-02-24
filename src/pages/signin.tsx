import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useWallet } from "@meshsdk/react";
import { signIn } from "next-auth/react";

import {
  Flex,
  Heading,
  Button,
  Stack,
  Box,
  Avatar,
  FormControl,
  Select
} from "@chakra-ui/react";
import { handleReactApiError } from "@/utils/react";
import { FeedbackAlert } from "@/components/FeedbackAlert";

export default function Signin() {
  const router = useRouter();

  const { wallet, connected } = useWallet();

  const [errorMessage, setErrorMessage] = useState<string[]>([]);

  const [stakeAddress, setStakeAddress] = useState<string | undefined>(
    undefined
  );

  const [stakeAddresses, setStakeAddresses] = useState<Array<string>>([]);

  useEffect(() => {
    if (stakeAddress === undefined && stakeAddresses?.length === 1) {
      setStakeAddress(stakeAddresses[0]);
    }
  }, [stakeAddress, stakeAddresses]);

  useEffect(() => {
    (async () => {
      if (connected) {
        setStakeAddresses(await wallet.getRewardAddresses());
      }
    })();
  }, [wallet, connected]);

  const userLogin = async (event: FormEvent) => {
    event.preventDefault();

    try {
      if (stakeAddress === undefined) {
        return;
      }

      const payload = {
        url: process.env.NEXT_PUBLIC_HOST + "/api/auth/callback/credentials",
        action: "Login",
        timestamp: Date.now(),
      };

      const signature = await wallet.signData(
        stakeAddress,
        JSON.stringify(payload)
      );

      const signinPayload = {
        key: signature.key as string,
        signature: signature.signature as string,
        redirect: false,
      };

      await signIn('credentials', signinPayload);

      if (router.query.callbackUrl && typeof router.query.callbackUrl === "string") {
        router.push(new URL(router.query.callbackUrl));
      }
    } catch (err) {
      handleReactApiError(err, setErrorMessage);
    }
  };

  return (
    <Flex
      flexDirection="column"
      width="100wh"
      height="calc(90vh - 60px)"
      justifyContent="center"
      alignItems="center"
    >
      <Stack
        flexDir="column"
        mb="2"
        justifyContent="center"
        alignItems="center"
      >
        <Avatar bg="gray.500" />
        <Heading>Welcome</Heading>
        <Box minW={{ base: "90%", md: "468px" }}>
          <form onSubmit={(event: FormEvent) => userLogin(event)}>
            <Stack
              spacing={6}
              p="8"
              backgroundColor="whiteAlpha.500"
              boxShadow="md"
              border="1px"
              borderColor="gray.100"
              borderRadius="10px"
            >
              <FeedbackAlert errorMessage={errorMessage}/>
              <FormControl>
                <Select
                  color="gray.500"
                  required={true}
                  placeholder="Wallet address"
                  disabled={stakeAddresses.length < 2}
                  value={stakeAddress}
                  onChange={(event) => setStakeAddress(event.target.value)}
                >
                  {stakeAddresses.map((stkAddress) => {
                    return (
                      <option key={stkAddress} value={stkAddress}>
                        {stkAddress}
                      </option>
                    );
                  })}
                </Select>
              </FormControl>

              <Button
                borderRadius={10}
                type="submit"
                variant="solid"
                colorScheme="gray"
                width="full"
              >
                Login
              </Button>
            </Stack>
          </form>
        </Box>
      </Stack>
      <Box>
        New to us? <Link href="/signup">Sign Up</Link>
      </Box>
    </Flex>
  );
}
