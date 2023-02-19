import { FormEvent, Key, useEffect, useState } from "react";
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
  Select,
  Alert,
  AlertDescription,
} from "@chakra-ui/react";

export default function Signin() {
  const router = useRouter();

  const { wallet, connected } = useWallet();

  const [errorMessage, setErrorMessage] = useState<Array<String>>([]);

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

      const response = await signIn('credentials', signinPayload);

      console.log(response);
    } catch (err) {
      const error = err as any;
      if (!error?.status) {
        setErrorMessage(["No Server Response"]);
      } else if (error.status === 401) {
        setErrorMessage(["Unauthorized"]);
      } else if (error.status === 500) {
        setErrorMessage(["Server error"]);
      } else if (error.error) {
        setErrorMessage(error.error);
      }
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
              {errorMessage.length > 0 &&
                errorMessage.map((error) => {
                  return (
                    <Alert status="error" key={error as Key}>
                      <AlertDescription>
                        {error} <br />
                      </AlertDescription>
                    </Alert>
                  );
                })}
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
