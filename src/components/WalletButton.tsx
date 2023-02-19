import {
  Box,
  Button,
  Image,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useWallet, useWalletList } from "@meshsdk/react";
import { signOut } from "next-auth/react";
import React, { useEffect, useState } from "react";
import { WalletBalance } from "./WalletBalanace";

export default function WalletButton() {
  const wallets = useWalletList();

  const [hideMenuList, setHideMenuList] = useState(true);

  const { connect, connected, disconnect, connecting, name } = useWallet();

  useEffect(() => {
    const walletName = localStorage.getItem('walletName');
    if (walletName) {
      connect(walletName);
    }
  }, [connect]);

  useEffect(() => {
    localStorage.setItem('walletName', name);
  }, [name]);

  return (
    <Box
      onMouseEnter={() => setHideMenuList(false)}
      onMouseLeave={() => setHideMenuList(true)}
      w="40"
      me="2"
    >
      <Button width="100%">
        <WalletBalance
          connected={connected}
          connecting={connecting}
          name={name}
          label="Connect wallet"
        />
      </Button>
      <Stack hidden={hideMenuList} position="absolute" spacing="0px" w="40">
        {connected ? (
          <Stack
            h="40px"
            direction="row"
            alignItems="center"
            borderRadius="var(--chakra-radii-md)"
            _hover={{ backgroundColor: "gray.50" }}
            cursor="pointer"
            onClick={() => {
              disconnect();
            }}
          >
            <Text textTransform={"capitalize"} ms="2">
              Disconnect
            </Text>
          </Stack>
        ) : (
          wallets.map((wallet) => {
            return (
              <Stack
                key={wallet.name + wallet.version}
                direction="row"
                h="40px"
                alignItems="center"
                borderRadius="var(--chakra-radii-md)"
                _hover={{ backgroundColor: "gray.50" }}
                cursor="pointer"
                onClick={() => {
                  connect(wallet.name);
                  signOut();
                }}
              >
                <Image src={wallet.icon} alt="icon" h="6" ms="2" />
                <Text textTransform={"capitalize"}>{wallet.name}</Text>
              </Stack>
            );
          })
        )}
      </Stack>
    </Box>
  );
}
