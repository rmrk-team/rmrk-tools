import { Keyring } from "@polkadot/keyring";
import { KeyringPair } from "@polkadot/keyring/types";

export default (): KeyringPair[] => {
  const k = [];
  const keyringAlice = new Keyring({ type: "sr25519" });
  const keyringBob = new Keyring({ type: "sr25519" });
  const keyringCharlie = new Keyring({ type: "sr25519" });
  k.push(keyringAlice.addFromUri("//Alice"));
  k.push(keyringBob.addFromUri("//Bob"));
  k.push(keyringCharlie.addFromUri("//Charlie"));
  return k;
};
