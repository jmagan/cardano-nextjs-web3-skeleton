import { ChevronDownIcon } from "@chakra-ui/icons";
import { Image, Text } from "@chakra-ui/react";
import { useLovelace, useWalletList } from "@meshsdk/react";


interface WalletBalanceProps {
  connected: boolean,
  name: string,
  connecting: boolean, 
  label: string
}

export const WalletBalance = ({ connected, name, connecting, label }: WalletBalanceProps) => {
  const wallet = useWalletList().find((wallet) => wallet.name === name);
  const balance = useLovelace();

  return connected && balance && wallet?.icon ? (
    <>
      <Image src={wallet.icon} alt="Icon" h="6"/>{' '}₳{' '}
      {parseInt((parseInt(balance, 10) / 10_000).toString(), 10) / 100}
    </>
  ) : connected && wallet?.icon ? (
    <>
      <Image src={wallet.icon} alt="Icon" h="6"/>
    </>
  ) : connecting ? (
    <>Connecting...</>
  ) : (
    <>
      {label} <ChevronDownIcon />
    </>
  );
};