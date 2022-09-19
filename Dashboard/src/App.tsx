

import Modal from 'react-modal';
import { Web3Storage } from 'web3.storage'
import network from "./configs/network";
import useAeternitySDK from './hooks/useAeternitySDK';
import { MutableRefObject, useEffect, useRef, useState } from 'react';
import { AeSdkAepp, AE_AMOUNT_FORMATS, AeSdk, Node, MemoryAccount } from '@aeternity/aepp-sdk';

import './App.css';
import logo from './assets/logo.png';
import logoBG from './assets/logo.gif';
import Circle1 from "./assets/circle1.png";
import Circle2 from "./assets/circle2.png";
import logoBody from './assets/logo_body.png';
import EncodedACI from './assets/aci/aci.json';
import HeaderImage from "./assets/landingbg.png";

const aenumber = 1000000000000000000;
const WalletConnectionStatus = Object.freeze({ Error: 0, Connecting: 1, Connected: 2 });
const App = () => {

    // Wallet, AE and client state
    const [client, clientReady] = useAeternitySDK();
    const [balance, setBalance] = useState('loading...');
	const [errorMsg, setErrorMsg] = useState<string>("");
	const aeSdk: MutableRefObject<AeSdkAepp | null> = useRef(null);
	const [contractBalance, setContractBalance] = useState('loading...');
	const [status, setStatus] = useState(WalletConnectionStatus.Connecting)

	// Smart contract state
    const voiceArr = [<></>];
    const ACIJson = JSON.stringify(EncodedACI);
	const [reward, setReward] = useState<string>("")
	const [answer, setAnswer] = useState<string>("A")
	const [contract, setContract] = useState<any>("")
	const [deposit, setDeposit] = useState<string>("")
	const [voiceID, setVoiceID] = useState<string>("")
	const [voiceLink, setVoiceLink] = useState<string>("")
	const [maxReward, setMaxReward] = useState<string>("")
	const [voiceRecords, setVoiceRecords] = useState<any>("")
	const [voiceArrCheck, setVoiceArrCheck] = useState<string>(null)

    // Modal state 
    const [modalIsOpen, setIsOpen] = useState(false);
    const [voiceModal, setVoiceModal] = useState(false);
    const [depositModal, setDepositModal] = useState(false);

    // Modal function 
    function openModal() {  setIsOpen(true);  setVoiceModal(true); setDepositModal(true);}
    function closeModal() {  setIsOpen(false);  setVoiceModal(false); setDepositModal(false);}

    // Smart contract method - get voice records 
	const getVoiceRecords = async function () {
        let result = (await contract.methods.get_voice_records()).decodedResult;
        console.log(result);
        setVoiceRecords(result)
    }

    // Smart contract method - delete voice records 
	const deleteVoiceRecord = async function (id:string) {
       console.log((await contract.methods.delete_voice_record(parseInt(id)) ).decodedResult)
       getVoiceRecords();
    }
     
    // Smart contract method - check contract balance
    const updateContractBalance = async function(){
        let balance = (await contract.methods.check_contract_balance()).decodedResult
        console.log(balance);
        balance = parseInt(balance) / aenumber;
        setContractBalance(balance);
    }

    // Smart contract method - create voice record
	const createVoiceRecord = async function () {

        if(!voiceLink){
            alert('Voice file is uploading to IPFS');
        }

        if(!voiceLink || !reward || !maxReward || !answer) {
            console.log(voiceLink);
            console.log(reward);
            console.log(maxReward);
            console.log(answer);
            alert('Please insert all input');
            return false;
        }

        setVoiceModal(false);
        let r = parseFloat(reward) * aenumber;
        let mr = parseFloat(maxReward) * aenumber;
        console.log((await contract.methods.create_voice_record(voiceLink, r, mr, answer) ).decodedResult)
        getVoiceRecords();
        
        console.log('created');
    }
    
    // Smart contract method - deposit to smart contract 
	const depositContract = async function () {
        let d = parseFloat(deposit) * aenumber;
        setDepositModal(false); 
        setBalance('Loading ...');
        setContractBalance('Loading ...');
        console.log((await contract.methods.deposit_to_contract({ amount: d }) ).decodedResult)
        updateContractBalance();
        updateAccountBalance();
    }
    
    // Smart contract method - clear player data 
	const clearPlayer = async function () {
       console.log((await contract.methods.clear_completed_player()).decodedResult)
    }
    
    // Function Upload file to ipfs and get CID
	const uploadFile = async function (e : FileList | null) {
        const client = new Web3Storage({ token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDFjMzYzMmY5MmNlOWQ4NTU4QzIyOWFGMzg1ZmM1MDg4ODYyNGVDNzYiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2NjM0Njk5NDQyOTgsIm5hbWUiOiJEZW1vIn0.OE6oIkfAJf24E-MPCrV4jfhPy2fNV4RaJGtWXGKCKg4" })
        const cid = await client.put(e)
        setVoiceLink("https://" + cid + ".ipfs.w3s.link/" + e[0].name)
        console.log('done');
    }


   // Update account balance 
    const updateAccountBalance = async function(){
        if (!aeSdk.current) return;
        const _address: any = await aeSdk.current.address()
        const _balance: any = await aeSdk.current.getBalance(_address, {
            format: AE_AMOUNT_FORMATS.AE
        });
        setBalance(_balance);
    }

    // Get wallet account details 
    const fetchAccountDetails = async function (walletNetworkId: string) {
        if (!aeSdk.current) return;
        if (status !== WalletConnectionStatus.Error && walletNetworkId !== network.id) {
            setErrorMsg(`Connected to the wrong network "${walletNetworkId}". please switch to "${network.id}" in your wallet.`)
            setStatus(WalletConnectionStatus.Error);
        } else if(status !== WalletConnectionStatus.Connected){
            setStatus(WalletConnectionStatus.Connected);
            let contractAddress = 'ct_tPjW65n8wYL5MkiNYgQq4hACiAi4YX3557xV38CriEutwKq4H'
            const contractInstance = await aeSdk.current.getContractInstance({aci: JSON.parse(ACIJson), contractAddress}); 
            setContract(contractInstance);
            updateAccountBalance();
        }
    }   

    // Check ae client and fetch wallet account details 
	useEffect(() => {
		if (clientReady && client) {
			aeSdk.current = client.current.aeSdk;
        if (!aeSdk.current) return;
			aeSdk.current.onNetworkChange = (params) => fetchAccountDetails(params.networkId);
			fetchAccountDetails(client.current.walletNetworkId);
		}
	}, [clientReady, client]);

    // If contract found then get voice records 
	useEffect(() => {
        if(contract){
            updateContractBalance();
            getVoiceRecords()
        }
	}, [contract]);


    if(voiceRecords){
        voiceRecords.forEach((record, index) => {
            setVoiceArrCheck('1');
            voiceArr.push(
              <div className='voice-item' key={index}>
                    <audio controls>
                    <source src={record.voice_link} type="audio/mpeg"/>
                    Your browser does not support the audio element.
                    </audio>
                    <div> <p> Reward </p> <b> Æ {parseFloat(record.reward)/ aenumber} </b></div>
                    <div> <p> Max Reward </p> <b> Æ {parseFloat(record.max_reward)/ aenumber} </b></div>
                    <div> <p> Answer </p> <b>{record.answer}</b></div>
                    <button  onClick={() => {deleteVoiceRecord(record.id)}}>Delete</button> 
              </div>
            );
        });

        return (
            <>
                <div className="App">
                    <header className="App-header">
                        <div>
                            <img src={logo}/>
                        </div>
                        <div>
                            <a href='#' className='active'> Dashboard </a>
                            <a href='#' onClick={() => setIsOpen(true)}> Insight</a>
                            <a className='balance' href='#'  onClick={() => setDepositModal(true)}> Contract balance : Æ {contractBalance} </a>
                        </div>
                    </header>
                    <div className='App-body'>
                        <div id='imageWrapperContainer'>
                            <div id="imageWrapper">
                                <img id='circle1' src={Circle1} />
                                <img id='circle2' src={Circle1} />
                                <img id='circle3' src={Circle2} />
                                <div id='homeImage'>
                                    <img src={HeaderImage}  />
                                </div>
                            </div>
                        </div>
                        <div id='voiceRecords'>
                            <div id='voiceRecordsHeader'>
                                <h2> Ads Content </h2>
                                <button id='createAds' onClick={() => setVoiceModal(true)}> Create Ads </button>
                            </div>
                            <div id='voiceArrsection'>
                                {voiceArrCheck === null ? 
                                    <b id='noAd'> There is no ad content yet. Click on Create Ads button to create new ad content </b>
                                    : voiceArr
                                }
                            </div>
                        </div>
                    </div>
                </div>
                <Modal closeTimeoutMS={500} isOpen={modalIsOpen} onRequestClose={closeModal}>
                    <div className="span-container">
                        <span className="one"></span>
                        <span className="two"></span>
                        <span className="three"></span>
                        <span className="four"></span>
                    </div>
                    <h2> What's Next </h2>
                    <p> Insight Page - Advertisers will be able to view their advertising insights, statistics and reports.  </p>
                    <button onClick={() => setIsOpen(false)}> Got it </button>
                </Modal>
                <Modal id='createModal' closeTimeoutMS={500} isOpen={voiceModal} onRequestClose={closeModal}>
                    <h3> Create Ad </h3>

                    <h4> Upload voice file </h4> 
                    <input type="file" onChange={e =>  {uploadFile(e.target.files)} } /> 

                    <h4> Reward  ( Æ )</h4> 
                    <input type='number' step='0.01' max='0.01' value={reward} onChange={e => setReward(e.target.value)}/> 
                 
                    <h4> Max Reward  ( Æ )</h4> 
                    <input type='number' onChange={e => setMaxReward(e.target.value)}/> 

                    <h4> Answer </h4> 
                    <select onChange={e => setAnswer(e.target.value)}>
                        <option value='A'> A</option>
                        <option value='B'> B</option>
                        <option value='C'> C</option>
                        <option value='D'> D</option>
                        <option value='E'> E</option>
                        <option value='F'> F</option>
                    </select>
                 
                    <button onClick={() => createVoiceRecord()} className='create'> Create </button>
                    <button onClick={() => setVoiceModal(false)} className='close-modal'> ✖ </button>
                </Modal>
                <Modal id='depositModal' closeTimeoutMS={500} isOpen={depositModal} onRequestClose={closeModal}>
                    <h3> Deposit Fund to Contract. </h3>
                    <div> 
                        <p> Contract Balance </p> 
                        <b> Æ {contractBalance} </b> 
                    </div>
                    <div> 
                        <p> Account Balance </p> 
                        <b> Æ {balance} </b> 
                    </div>
                    <hr/>
                    <h4> Amount to deposit ( Æ ) </h4> 
                    <input type='number' onChange={e => setDeposit(e.target.value)} />
                    <button className='deposit' onClick={() => depositContract()}> Deposit </button> 
                    <button onClick={() => setDepositModal(false)} className='close-modal'> ✖ </button>
                </Modal>
            </>
        );

    }
    else {

        return (
            <div id='loader'>
                <img src={logoBG} id='logoBg'/>
                <img src={logoBody} id='logoBody'/>
                {status !== WalletConnectionStatus.Connected ? 
                    <p>
                        No wallet detected, please download <a href='https://chrome.google.com/webstore/detail/superhero/mnhmmkepfddpifjkamaligfeemcbhdne/related' target="_blank">SuperHero Wallet</a> and connect to Æternity wallet
                    </p>
                    : 
                    <p> Reload the page if it takes more than 3 seconds to load </p>
                }
            </div>
        )
      
    }

};

export default App;
