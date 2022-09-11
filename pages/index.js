import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Web3Modal from 'web3modal';
import { Avatar, Flex, Box, Text, Button } from 'theme-ui';

import { nftaddress, nftmarketaddress } from '../config';

import NFT from '../artifacts/contracts/NFT.sol/NFT.json';
import Market from '../artifacts/contracts/Market.sol/NFTMarket.json';

let rpcEndpoint = null;

if (process.env.NEXT_PUBLIC_WORKSPACE_URL) {
  rpcEndpoint = process.env.NEXT_PUBLIC_WORKSPACE_URL;
}

export default function Home() {
  const [nfts, setNfts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingState, setLoadingState] = useState('not-loaded');
  useEffect(() => {
    loadNFTs();
  }, []);

  useEffect(() => {
    const getUsers = async () => {
      const { data } = await axios.get('https://randomuser.me/api/?results=50');
      setUsers(data.results);
    };
    getUsers();
  }, []);

  async function loadNFTs() {
    const provider = new ethers.providers.JsonRpcProvider(rpcEndpoint);
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider);
    const marketContract = new ethers.Contract(
      nftmarketaddress,
      Market.abi,
      provider
    );
    const data = await marketContract.fetchMarketItems();

    const items = await Promise.all(
      data.map(async (i) => {
        const tokenUri = await tokenContract.tokenURI(i.tokenId);
        const meta = await axios.get(tokenUri);
        let price = ethers.utils.formatUnits(i.price.toString(), 'ether');
        let item = {
          price,
          itemId: i.itemId.toNumber(),
          seller: i.seller,
          owner: i.owner,
          image: meta.data.image,
          name: meta.data.name,
          description: meta.data.description,
        };
        return item;
      })
    );
    setNfts(items);
    setLoadingState('loaded');
  }
  async function buyNft(nft) {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(nftmarketaddress, Market.abi, signer);

    const price = ethers.utils.parseUnits(nft.price.toString(), 'ether');
    const transaction = await contract.createMarketSale(
      nftaddress,
      nft.itemId,
      {
        value: price,
      }
    );
    await transaction.wait();
    loadNFTs();
  }
  if (loadingState === 'loaded' && !nfts.length)
    return <h1 className="px-20 py-10 text-3xl">No items in marketplace</h1>;
  return (
    <div className="flex justify-center">
      <div className="px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {nfts.map((nft, i) => (
            <Flex
              key={i}
              sx={{
                flexDirection: 'column',
                border: '3px solid',
                borderColor: 'transparent',
                ':hover': { border: '3px solid', borderColor: 'secondary' },
              }}
              className="flex flex-col  shadow overflow-hidden hover:scale-125"
            >
              <video
                className="transform hover:scale-110 ease-in-out duration-700"
                sx={{
                  objectFit: 'contain',
                  objectPosition: 'center',
                  width: '100%',
                  height: '100%',
                  flex: 1,
                }}
                autoPlay
                loop
                playsInline
                src={nft.image}
              />
              <Avatar
                sx={{
                  mt: -50,
                  ml: 3,
                  zIndex: 4,
                  width: 100,
                  height: 100,
                  objectFit: 'cover',
                  objectPosition: 'center',
                  border: '4px solid',
                  borderColor: 'secondary',
                }}
                src={users[i]?.picture?.thumbnail}
              />
              <Flex sx={{ flexDirection: 'column', p: 3 }}>
                <Text sx={{ fontWeight: 'bold', fontSize: 24 }}>
                  {nft.name}
                </Text>
                <div style={{ height: '70px', overflow: 'hidden' }}>
                  <p className="text-gray-400">{nft.description}</p>
                </div>
              </Flex>
              <Box sx={{ bg: 'muted', p: 3 }}>
                <p className="text-2xl mb-4 font-bold">{nft.price} ETH</p>
                <Button
                  className="w-full font-bold py-2 px-12"
                  onClick={() => buyNft(nft)}
                >
                  Buy
                </Button>
              </Box>
            </Flex>
          ))}
        </div>
      </div>
    </div>
  );
}
