import { FormEvent, Key, useEffect, useState } from "react";
import axios from "@/utils/axios";
import { useRouter } from "next/router";

import {
  Flex,
  Heading,
  Input,
  Button,
  InputGroup,
  Stack,
  InputLeftElement,
  chakra,
  Box,
  Link,
  Avatar,
  FormControl,
  Select,
  Alert,
  AlertDescription,
} from "@chakra-ui/react";
import { FaUserAlt, FaEnvelope } from "react-icons/fa";
import { useWallet } from "@meshsdk/react";

const CFaUserAlt = chakra(FaUserAlt);
const CFaEnvelope = chakra(FaEnvelope);

export default function SignUp() {
  const router = useRouter();

  const { wallet, connected } = useWallet();
  const [errorMessage, setErrorMessage] = useState<Array<String>>([]);

  const [stakeAddress, setStakeAddress] = useState<string | undefined>(
    undefined
  );

  const [stakeAddresses, setStakeAddresses] = useState<Array<string>>([]);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

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

  const userSignUp = async (evt: FormEvent) => {
    evt.preventDefault();

    try {
      if (stakeAddress === undefined) {
        return;
      }

      const payload = {
        url: process.env.NEXT_PUBLIC_HOST + "/api/signup",
        action: "Sign up",
        email: userEmail,
        timestamp: Date.now(),
      };

      const signature = await wallet.signData(
        stakeAddress,
        JSON.stringify(payload)
      );

      await axios.post(
        "/api/signup",
        {
          name: userName,
          key: signature.key,
          signature: signature.signature,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      router.push("/");
    } catch (err) {
      const error = err as any;
      if (!error?.response) {
        setErrorMessage(["No Server Response"]);
      } else if (error.response.status === 401) {
        setErrorMessage(["Unauthorized"]);
      } else if (error.response.status === 500) {
        setErrorMessage(["Server error"]);
      } else if (Array.isArray(error.response.data.errors.msg)) {
        setErrorMessage(
          error.response.data.errors.msg.map(
            (val: any) => val.param + ": " + val.msg
          )
        );
      } else {
        setErrorMessage(
          error.response.data.errors.map((error: any) => error.msg)
        );
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
      m="2"
    >
      <Stack
        flexDir="column"
        mb="2"
        justifyContent="center"
        alignItems="center"
      >
        <Avatar bg="gray.500" />
        <Heading>Sign up</Heading>
        <Box minW={{ base: "90%", md: "640px" }}>
          <form onSubmit={userSignUp}>
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
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <CFaUserAlt color="gray.300" />
                  </InputLeftElement>
                  <Input
                    type="name"
                    required={true}
                    placeholder="Name"
                    onChange={(event) => setUserName(event.target.value)}
                  />
                </InputGroup>
              </FormControl>
              <FormControl>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <CFaEnvelope color="gray.300" />
                  </InputLeftElement>
                  <Input
                    type="email"
                    required={true}
                    placeholder="email address"
                    onChange={(event) => setUserEmail(event.target.value)}
                  />
                </InputGroup>
              </FormControl>
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
                Sign up
              </Button>
            </Stack>
          </form>
        </Box>
      </Stack>
      <Box>
        New to us? <Link href="#">Sign Up</Link>
      </Box>
    </Flex>
  );
}
