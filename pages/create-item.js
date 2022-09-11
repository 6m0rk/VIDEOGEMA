import { useState } from "react";
import { ethers } from "ethers";
import { create as ipfsHttpClient } from "ipfs-http-client";
import { useRouter } from "next/router";
import Web3Modal from "web3modal";
import {
  Flex,
  Box,
  Button,
  Spinner,
  Input,
  Textarea,
  Progress,
} from "theme-ui";

const client = ipfsHttpClient("https://ipfs.infura.io:5001/api/v0");

import { nftaddress, nftmarketaddress } from "../config";

import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import Market from "../artifacts/contracts/Market.sol/NFTMarket.json";

export default function CreateItem() {
  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [fileUrl, setFileUrl] = useState(null);
  const [max, setMax] = useState(0);
  const [value, setValue] = useState(0);
  const [formInput, updateFormInput] = useState({
    price: "",
    name: "",
    description: "",
  });
  const router = useRouter();

  async function onChange(e) {
    const file = e.target.files[0];
    console.log(file);
    setMax(file.size);
    try {
      const added = await client.add(file, {
        progress: (prog) => {
          console.log(`received: ${prog}`);
          setValue(prog);
          file.size !== prog ? setLoading(true) : setLoading(false);
        },
      });
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;
      setFileUrl(url);
    } catch (error) {
      console.log("Error uploading file: ", error);
      setError(error.message);
    }
  }
  async function createMarket() {
    const { name, description, price } = formInput;
    if (!name || !description || !price || !fileUrl) return;
    /* first, upload to IPFS */
    const data = JSON.stringify({
      name,
      description,
      image: fileUrl,
    });
    try {
      const added = await client.add(data);
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;
      /* after file is uploaded to IPFS, pass the URL to save it on Polygon */
      createSale(url);
    } catch (error) {
      console.log("Error uploading file: ", error);
    }
  }

  async function createSale(url) {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    /* next, create the item */
    let contract = new ethers.Contract(nftaddress, NFT.abi, signer);
    let transaction = await contract.createToken(url);
    let tx = await transaction.wait();
    let event = tx.events[0];
    let value = event.args[2];
    let tokenId = value.toNumber();

    const price = ethers.utils.parseUnits(formInput.price, "ether");

    /* then list the item for sale on the marketplace */
    contract = new ethers.Contract(nftmarketaddress, Market.abi, signer);
    let listingPrice = await contract.getListingPrice();
    listingPrice = listingPrice.toString();

    transaction = await contract.createMarketItem(nftaddress, tokenId, price, {
      value: listingPrice,
    });
    await transaction.wait();
    router.push("/");
  }

  return (
    <Flex
      sx={{
        p: [1, 2, 3, 4],
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Flex sx={{ flexDirection: "column", width: ["100%", "80%", 500] }}>
        <Input
          sx={{ mb: 3 }}
          placeholder="Asset Name"
          onChange={(e) =>
            updateFormInput({ ...formInput, name: e.target.value })
          }
        />
        <Textarea
          sx={{ mb: 3 }}
          placeholder="Asset Description"
          onChange={(e) =>
            updateFormInput({ ...formInput, description: e.target.value })
          }
        />
        <Input
          sx={{ mb: 3 }}
          placeholder="Asset Price in Eth"
          onChange={(e) =>
            updateFormInput({ ...formInput, price: e.target.value })
          }
        />

        <Input type="file" name="Asset" onChange={onChange} />
        <Progress sx={{ color: "secondary", mb: 3 }} max={max} value={value} />
        {error && <p className="text-red-500">{error}</p>}
        {fileUrl && (
          <video className="mt-4" width="100%" src={fileUrl} controls loop />
        )}
        <Button onClick={createMarket}>Create Digital Asset</Button>
      </Flex>
    </Flex>
  );
}
