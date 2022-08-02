import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import react, { useState, useEffect } from "react";
import { useMetaMask, useConnectedMetaMask } from "metamask-react";
import { ethers } from "ethers";
import axios from "axios";

import contractAbi from "../contracts/artifacts/Birdstest.json";

const CHAIN = process.env.NEXT_PUBLIC_CHAIN;
const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID;
const CONTRACT = process.env.NEXT_PUBLIC_CONTRACT;

import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";

const shortenAddress = (address) =>
    `${address.slice(0, 5)}...${address.slice(address.length - 4)}`;

const investor = require("../wl_investor.json");
const supporter = require("../wl_supporter.json");
const holder = require("../wl_holder.json");
const friend = require("../wl_friend.json");

// console.log(investor);

const readIPFS = async (url) => {
    const { data } = await axios.get(
        `https://dotconnex.mypinata.cloud/ipfs/${url.replace("ipfs://", "")}`
    );

    return data;
};

const parseImage = (url) => {
    return url.slice(7, url.length);
};

export default function Home() {
    const [play, setPlay] = useState(false);
    const [header, setHeader] = useState("");
    const [content, setContent] = useState("");
    const [address, setAddress] = useState(null);
    const [type, setType] = useState(undefined);
    const [ipfs, setIpfs] = useState({});
    // const [ipfs, setIpfs] = useState({
    //     name: "Lorem Isam",
    //     description: "Lorem Isam.",
    //     image: "ipfs://QmZz2rp6829gpdjB9Ucb2FaSocZYMBxQmto5yZ1rN6n2gs",
    //     external_url: "https://www.example.info/",
    //     dna: "0x",
    //     edition: 1,
    //     date: 1650613719030,
    //     attributes: [
    //         {
    //             trait_type: "Lorem Isem",
    //             value: "Generating",
    //         },
    //     ],
    //     compiler: "I don't tell you engine",
    // });
    const [minted, setMinted] = useState(false);

    const { status, connect, account, chainId, ethereum } = useMetaMask();

    useEffect(() => {
        if (play) {
            hanleConnect(status);
        }

        if (account) {
            setType(checkType());
        }
    }, [status, chainId, account]);

    const checkType = () => {
        if (investor.find((i) => i.toUpperCase() === account.toUpperCase())) {
            return "investor";
        }

        if (supporter.find((i) => i.toUpperCase() === account.toUpperCase())) {
            return "supporter";
        }

        if (holder.find((i) => i.toUpperCase() === account.toUpperCase())) {
            return "holder";
        }

        if (friend.find((i) => i.toUpperCase() === account.toUpperCase())) {
            return "friend";
        }

        return undefined;
    };

    // const whiteListAddressesLeaves = whiteListAddresses.map((x) =>
    //     keccak256(x)
    // );
    // const tree = new MerkleTree(whiteListAddressesLeaves, keccak256, {
    //     sortPairs: true,
    // });

    // const MerkleProof = (address) => {
    //     const hashedAddress = keccak256(address);
    //     const _proof = tree.getHexProof(hashedAddress);
    //     // console.log(`proof: ${_proof.join(",")}`);
    //     if (_proof.length > 0) {
    //         setBoard("ALLOW LIST");
    //     } else {
    //         setBoard("NOT ALLOW");
    //     }
    //     setProof(_proof.join(","));
    // };

    const hanleConnect = (status) => {
        setHeader("Your address");

        if (status === "initializing") {
            setContent("Synchronisation with MetaMask ongoing...");
        } else if (status === "unavailable") setAddr("MetaMask not available");
        else if (status === "notConnected") {
            setContent("Connect to MetaMask");
            connect();
        } else if (status === "connecting") {
            setContent("Connecting...");
        } else if (status === "connected") {
            setContent(shortenAddress(account) + " [" + chainId + "]");
        }
    };

    const errManager = (message) => {
        const _match = String(message).match(/error=(.*?), code/);
        // console.log(_match);
        if (_match) {
            const error_code = JSON.parse(_match[1])["code"];

            if (error_code === -32000) {
                return "Insufficient funds for intrinsic transaction";
            } else {
                return JSON.parse(_match[1])["message"];
            }
        } else {
            if (typeof message === "object" && message !== null) {
                return message.message;
            }
            return message;
        }
    };

    const mint = async () => {
        setHeader("Status");
        // if (status === "notConnected") {
        //     connect();
        // }
        console.log(chainId, CHAIN_ID);

        if (chainId != CHAIN_ID) {
            setContent(`Please switch to ${CHAIN}`);
            return;
        }

        if (type == undefined) {
            setHeader("Warning");
            setContent(`You are not in our whitelist`);
            // setContent(
            //     "Proident eiusmod dolor adipisicing irure tempor sunt elit. Ad eiusmod tempor qui sit sint id dolor do anim minim adipisicing proident. Excepteur esse incididunt sit dolore tempor ea aliqua Lorem quis dolore ut. Duis incididunt ea anim tempor aliquip cillum sunt dolore officia id amet aliqua. Pariatur labore nisi eiusmod non laborum tempor duis nostrud sit. Pariatur reprehenderit exercitation ullamco nostrud Lorem ea voluptate velit labore. Minim nostrud eiusmod laboris fugiat nostrud exercitation fugiat fugiat veniam do incididunt ad sit amet."
            // );
            return;
        }
        setContent("Minting...");
        setMinted(false);

        let whiteListAddressesLeaves;

        if (type == "investor") {
            whiteListAddressesLeaves = investor.map((x) => keccak256(x));
        } else if (type == "supporter") {
            whiteListAddressesLeaves = supporter.map((x) => keccak256(x));
        } else if (type == "holder") {
            whiteListAddressesLeaves = holder.map((x) => keccak256(x));
        } else if (type == "friend") {
            whiteListAddressesLeaves = friend.map((x) => keccak256(x));
        }

        const tree = new MerkleTree(whiteListAddressesLeaves, keccak256, {
            sortPairs: true,
        });
        const hashedAddress = keccak256(account);
        const proof = tree.getHexProof(hashedAddress);
        console.log(proof);

        try {
            const { ethereum } = window;
            if (ethereum) {
                const provider = new ethers.providers.Web3Provider(ethereum);
                const signer = provider.getSigner();
                const nftContract = new ethers.Contract(
                    CONTRACT,
                    contractAbi.abi,
                    signer
                );
                const cost = await nftContract.cost();
                console.log(cost);
                // console.log("cost: ", ethers.utils.formatUnits(cost, "ether"));

                let nftTxn = await nftContract.Mint(proof, {
                    value: ethers.utils.parseEther(cost.toString()),
                });

                const receipt = await nftTxn.wait();
                console.log(receipt);
                if (receipt.status == 1) {
                    const _totalsupply = await nftContract.totalSupply();
                    // console.log(_totalsupply);
                    const _uri = await nftContract.tokenURI(_totalsupply);
                    // console.log(_uri);

                    // console.log(await readIPFS(_uri));
                    setIpfs(await readIPFS(_uri));
                    setMinted(true);
                    setContent("Congratulations");
                }
            }
        } catch (err) {
            console.error(err);
            setHeader("Error");
            setContent(`${errManager(err).slice(0, 120)}...`);
            // setContent(`${err.message.slice(0, 120)}...`);
        }
    };

    return (
        <div>
            <Head>
                <title>ˏ₍•ɞ•₎ˎ Birbsfriend</title>
                <meta name="description" content="Birbsfriend" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <div className="h-screen flex justify-center items-center">
                <div className="w-[1280px] h-[800px] bg-cover bg-no-repeat bg-[url('/Bg.png')] relative">
                    {/* machine */}
                    <div className="w-[421px] h-[410px] absolute top-[236px] left-[85px]">
                        <div
                            className={`${
                                play
                                    ? "bg-[url('/Machine2.gif')]"
                                    : "bg-[url('/Machine1.gif')]"
                            } bg-cover h-full hover:cursor-pointer`}
                            onClick={() => {
                                setPlay(!play);
                                // setHeader("Derivative Art");
                                // setContent("Free mint for stardust holders...");
                                hanleConnect(status);
                            }}
                        >
                            <div
                                className={`${
                                    play ? "invisible" : "visible"
                                } h-full flex justify-center items-center font-extrabold  text-4xl z-20 font-PixeloidMono text-green-500`}
                            >
                                Click Me
                            </div>
                        </div>
                    </div>

                    {/* mint */}
                    <div className="h-[75px] w-[162px] absolute top-[181px] left-[190px]">
                        {play ? (
                            <div
                                className="bg-[url('/Mint2.png')] hover:cursor-pointer h-full bg-cover"
                                onClick={mint}
                            ></div>
                        ) : (
                            <div className="bg-[url('/Mint1.png')] h-full bg-cover"></div>
                        )}
                    </div>

                    {/* neio */}
                    <div className="h-[147px] w-[451px] absolute top-[20px] left-[402px]">
                        <div className="bg-[url('/birbs.png')]  h-full bg-cover"></div>
                    </div>

                    {/* qoute */}
                    <div className="h-[321px] w-[422px] absolute top-[250px] left-[530px]  ">
                        <div
                            className={`${
                                play ? "opacity-90" : "opacity-0"
                            } bg-[url('/Template.png')]  h-full bg-cover font-PixeloidMono text-green-400 transition-opacity duration-500 ease-out `}
                        >
                            {/* header */}
                            <p className="text-3xl px-8 py-5">{header}</p>
                            {/* content */}
                            <p className="text-2xl px-8 py-5">{content}</p>
                        </div>
                    </div>
                    {/* minted Image */}

                    <div
                        className={`${
                            minted ? "opacity-100 z-10" : "opacity-0 -z-10"
                        } absolute top-[324px] left-[152px] w-[263px] h-[226px] transition-opacity duration-500 ease-out`}
                    >
                        {ipfs.image && (
                            <Image
                                src={`https://dotconnex.mypinata.cloud/ipfs/${parseImage(
                                    ipfs.image
                                )}`}
                                alt="minted"
                                layout="fill"
                                objectFit="cover"
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
