import { Finding, ethers, Initialize, getEthersProvider, HandleBlock, BlockEvent } from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import { COMET_ABI, getFindingInstance } from "./utils";
import { NetworkDataInterface, NM_DATA } from "./network";
import { BigNumber } from "ethers";

const networkManager = new NetworkManager(NM_DATA, 1);

export function provideInitialize(
  networkManager: NetworkManager<NetworkDataInterface>,
  provider: ethers.providers.Provider
): Initialize {
  return async () => {
    await networkManager.init(provider);
  };
}

export function provideHandleBlock(
  networkManager: NetworkManager<NetworkDataInterface>,
  provider: ethers.providers.Provider
): HandleBlock {
  let cometContract = new ethers.Contract(networkManager.get("cometAddr"), COMET_ABI, provider);

  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];
    const tokenReserves: BigNumber = BigNumber.from(
      await cometContract.getReserves({ blockTag: blockEvent.blockNumber })
    );
    if (tokenReserves.lt(networkManager.get("targetReserves"))) {
      findings.push(getFindingInstance(tokenReserves.toString(), networkManager.get("targetReserves").toString()));
    }
    return findings;
  };
}

export default {
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleBlock: provideHandleBlock(networkManager, getEthersProvider()),
};
