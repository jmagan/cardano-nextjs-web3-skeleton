import React, { FormEvent, useEffect, useState } from "react";
import axios from "@/utils/axios";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
} from "@chakra-ui/react";
import { FeedbackAlert } from "./FeedbackAlert";
import { handleReactApiError } from "@/utils/react";
import { ApiResponse } from "@/types/api";

export default function UserEditModal({
  isOpen,
  userId,
  onClose,
}: {
  isOpen: boolean;
  userId: string | null;
  onClose: () => void;
}) {
  const [errorMessage, setErrorMessage] = useState<string[]>([]);
  const [infoMessage, setInfoMessage] = useState<string[]>([]);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [role, setRole] = useState("user");

  useEffect(() => {
    setErrorMessage([]);
    setInfoMessage([]);
    const getUser = async () => {
      if (userId) {
        try {
          const response = await axios.get(`/api/admin/users/${userId}`);

          setEmail(response.data.data.email);
          setName(response.data.data.name);
          setWalletAddress(response.data.data.walletAddress);
          setRole(response.data.data.role ?? "");
        } catch (err) {
          handleReactApiError(err, setErrorMessage);
        }
      } else {
        setErrorMessage([]);
        setEmail("");
        setName("");
        setWalletAddress("");
        setRole("user");
      }
    };

    getUser();
  }, [userId]);

  const submitFormHandle = async (evt: FormEvent) => {
    evt.preventDefault();

    const payload = {
      name,
      email,
      walletAddress,
      role,
    };

    try {
      let response;
      if (userId) {
        response = await axios.patch<ApiResponse>(
          `/api/admin/users/${userId}`,
          payload
        );
      } else {
        response = await axios.post<ApiResponse>(`/api/admin/users`, payload);
      }

      if (typeof response.data.message === "string") {
        setInfoMessage([response.data.message]);
      } else {
        setInfoMessage(response.data.message);
      }

      onClose();
    } catch (e) {
      handleReactApiError(e, setErrorMessage);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setErrorMessage([]);
      setEmail("");
      setName("");
      setWalletAddress("");
      setRole("user");
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Heading className="modal-title">Edit user</Heading>
          <ModalCloseButton />
        </ModalHeader>
        <Flex direction="column" p="4">
          <Box>
            <FeedbackAlert
              errorMessage={errorMessage}
              infoMessage={infoMessage}
            />
          </Box>
          <form id="edit-user-form" onSubmit={submitFormHandle}>
            <Flex direction="column">
              <HStack>
                <FormControl>
                  <FormLabel htmlFor="email">Email</FormLabel>
                  <Input
                    type="email"
                    value={email}
                    required
                    onChange={(evt) => setEmail(evt.target.value)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel htmlFor="name">Name</FormLabel>
                  <Input
                    type="text"
                    value={name}
                    required
                    onChange={(evt) => setName(evt.target.value)}
                  />
                </FormControl>
              </HStack>
              <Box>
                <FormControl>
                  <FormLabel htmlFor="walletAddress">Wallet Address</FormLabel>
                  <Input
                    type="text"
                    value={walletAddress}
                    readOnly={!!userId}
                    required
                    onChange={(evt) => setWalletAddress(evt.target.value)}
                  />
                </FormControl>
              </Box>

              <Box className="col-12">
                <FormControl>
                  <FormLabel htmlFor="role">Role</FormLabel>
                  <Select
                    value={role}
                    onChange={(evt) => setRole(evt.target.value)}
                  >
                    <option value="user">User</option>
                    <option value="admin">Administrator</option>
                  </Select>
                </FormControl>
              </Box>
            </Flex>
          </form>
          <ModalFooter>
            <Button type="button" onClick={onClose} me="4">
              Close
            </Button>
            <Button type="submit" form="edit-user-form">
              Save changes
            </Button>
          </ModalFooter>
        </Flex>
      </ModalContent>
    </Modal>
  );
}
