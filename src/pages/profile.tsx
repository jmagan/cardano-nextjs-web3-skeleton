import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Center,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Select,
  useColorModeValue,
} from "@chakra-ui/react";
import { FormEvent, useEffect, useState } from "react";
import axios from "@/utils/axios";
import { handleReactApiError } from "@/utils/react";
import { FeedbackAlert } from "@/components/FeedbackAlert";
import { ApiDataResponse, ApiResponse } from "@/types/api";
import User from "@/types/user";

export default function Profile() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [walletAddress, setWalletAddress] = useState("");

  const [errorMessage, setErrorMessage] = useState<string[]>([]);
  const [infoMessage, setInfoMessage] = useState<string[]>([]);

  useEffect(() => {
    setErrorMessage([]);
    setInfoMessage([]);

    const getProfile = async () => {
      try {
        const response = await axios.get<ApiDataResponse<User>>("/api/profile");

        const profile = response.data.data;

        setUsername(profile.username);
        setEmail(profile.email);
        setName(profile.name);
        setWalletAddress(profile.walletAddress ?? "");
      } catch (error) {
        handleReactApiError(error, setErrorMessage);
      }
    };

    getProfile();
  }, []);

  const saveProfile = async (evt: FormEvent) => {
    evt.preventDefault();
    setInfoMessage([]);

    const payload = {
      name,
    };

    try {
      const response = await axios.patch<ApiResponse>("/api/profile", payload);
      setErrorMessage([]);
      if (typeof response.data.message === "string") {
        setInfoMessage([response.data.message]);
      } else {
        setInfoMessage(response.data.message);
      }
    } catch (error) {
      handleReactApiError(error, setErrorMessage);
    }
  };

  return (
    <Flex
      bg={useColorModeValue("gray.100", "gray.900")}
      align="center"
      justify="center"
    >
      <Card
        borderRadius="lg"
        m={{ base: 5, md: 16, lg: 10 }}
        p={{ base: 5, lg: 16 }}
        backgroundColor="white"
      >
        <CardHeader>
          <Center>
            <Heading size="lg">Profile</Heading>
          </Center>
        </CardHeader>
        <CardBody>
          <FeedbackAlert
            errorMessage={errorMessage}
            infoMessage={infoMessage}
          />
          <form onSubmit={(evt) => saveProfile(evt)}>
            <Flex direction="column" gap="4">
              <Flex direction={{ base: "column", md: "row" }} gap="4">
                <FormControl>
                  <FormLabel>Username</FormLabel>
                  <Input type="text" disabled={true} value={username} />
                </FormControl>
                <FormControl>
                  <FormLabel>Email address</FormLabel>
                  <Input type="email" disabled={true} value={email} />
                </FormControl>
                <FormControl>
                  <FormLabel>Name</FormLabel>
                  <Input
                    type="text"
                    required={true}
                    value={name}
                    onChange={(evt) => setName(evt.target.value)}
                  />
                </FormControl>
              </Flex>
              <FormControl>
                <FormLabel>Wallet address</FormLabel>
                <Select disabled={true} value={walletAddress}>
                  <option value={walletAddress}>{walletAddress}</option>
                </Select>
              </FormControl>
              <Button type="submit" color="gray.100" textColor="black" mt="4">
                Save
              </Button>
            </Flex>
          </form>
        </CardBody>
      </Card>
    </Flex>
  );
}
