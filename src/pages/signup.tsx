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
  FormErrorMessage,
} from "@chakra-ui/react";
import { FaUserAlt, FaEnvelope, FaHashtag } from "react-icons/fa";
import { useWallet } from "@meshsdk/react";
import { FeedbackAlert } from "@/components/FeedbackAlert";
import { handleReactApiError } from "@/utils/react";
import useDebounce from "@/hooks/useDebounce";
import { ApiResponse } from "@/types/api";

const CFaUserAlt = chakra(FaUserAlt);
const CFaEnvelope = chakra(FaEnvelope);
const CFaHastag = chakra(FaHashtag);

export default function SignUp() {
  const router = useRouter();

  const { wallet, connected } = useWallet();
  const [errorMessage, setErrorMessage] = useState<string[]>([]);

  const [stakeAddress, setStakeAddress] = useState<string | undefined>(
    undefined
  );

  const [stakeAddresses, setStakeAddresses] = useState<Array<string>>([]);
  const [userUsername, setUserUsername] = useState("");
  const debouncedUsername = useDebounce(userUsername, 500);
  const [invalidUsername, setInvalidUserName] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  // Select default wallet address
  useEffect(() => {
    if (stakeAddress === undefined && stakeAddresses?.length === 1) {
      setStakeAddress(stakeAddresses[0]);
    }
  }, [stakeAddress, stakeAddresses]);

  // Load wallet addresses from wallet
  useEffect(() => {
    (async () => {
      if (connected) {
        setStakeAddresses(await wallet.getRewardAddresses());
      }
    })();
  }, [wallet, connected]);

  // Validate username
  useEffect(() => {
    const validateUsername = async () => {
      if (debouncedUsername !== "") {
        const response = await axios.get<ApiResponse>(
          "/api/admin/users/validation/username",
          { params: { username: debouncedUsername } }
        );
        const data = response.data;
        console.log(data);

        if (data.message === "Valid") {
          setInvalidUserName("");
        } else if (typeof data.message === "string") {
          setInvalidUserName(data.message);
        }
      } else {
        setInvalidUserName("");
      }
    };
    validateUsername();
  }, [debouncedUsername]);

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
          username: userUsername,
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
              <FeedbackAlert errorMessage={errorMessage} />
              <FormControl isInvalid={invalidUsername !== ""}>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <CFaHastag color="gray.300" />
                  </InputLeftElement>
                  <Input
                    type="name"
                    required={true}
                    placeholder="Username"
                    minLength={4}
                    maxLength={20}
                    pattern="(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$"
                    onChange={(event) => setUserUsername(event.target.value)}
                  />
                </InputGroup>
                { invalidUsername !== "" && <FormErrorMessage>{ invalidUsername }</FormErrorMessage>}
              </FormControl>
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
