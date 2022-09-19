

import { Web3Storage } from 'web3.storage'
import network from "./configs/network";
import useAeternitySDK from './hooks/useAeternitySDK';
import { MutableRefObject, useEffect, useRef, useState } from 'react';
import { AeSdkAepp, AE_AMOUNT_FORMATS, AeSdk, Node, MemoryAccount } from '@aeternity/aepp-sdk';

import './App.css';
import logo from './assets/logo.png';
import logoBG from './assets/logo.gif';
import aci from './assets/aci/aci.json';
import logoBody from './assets/logo_body.png';

const WalletConnectionStatus = Object.freeze({ Error: 0, Connecting: 1, Connected: 2 });
const App = () => {

	const [client, clientReady] = useAeternitySDK();
	const [address, setAddress] = useState(null);
	const [balance, setBalance] = useState('loading...');
	const [contractBalance, setContractBalance] = useState('loading...');
	const [errorMsg, setErrorMsg] = useState<string>("");
	const [status, setStatus] = useState(WalletConnectionStatus.Connecting)
	const [contract, setContract] = useState<any>("")
	const [deposit, setDeposit] = useState<string>("")
	const [voiceID, setVoiceID] = useState<string>("")
	const [voiceLink, setVoiceLink] = useState<string>("")
	const [reward, setReward] = useState<string>("")
	const [maxReward, setMaxReward] = useState<string>("")
	const [answer, setAnswer] = useState<string>("A")
	const [ans, setAns] = useState<string>("")
	const [voiceRecords, setVoiceRecords] = useState<any>("")
	const [selectedFile, setSelectedFile] = useState<FileList | null>(null)
	const [completedPlayer, setCompletedPlayer] = useState<any>("")
    const ACI = JSON.stringify(aci);
    const contractAddress = 'ct_2398Y2S8Dg1Scjzxj7kJYvwMMzbt5sh7FFj1JuN59kWooDapjv';
	const aeSdk: MutableRefObject<AeSdkAepp | null> = useRef(null);
    const arr = [<></>];


    const updateAccountBalance = async function(){
        if (!aeSdk.current) return;
        const _address: any = await aeSdk.current.address()
        setAddress(_address);
        const _balance: any = await aeSdk.current.getBalance(_address, {
            format: AE_AMOUNT_FORMATS.AE
        });
        setBalance(_balance);
    }


	const getVoiceRecords = async function () {
        let result = (await contract.methods.get_voice_records()).decodedResult;
        console.log(result);
        setVoiceRecords(result)
    }

	const fetchAccountDetails = async function (walletNetworkId: string) {
    if (!aeSdk.current) return;
		if (status !== WalletConnectionStatus.Error && walletNetworkId !== network.id) {
			setErrorMsg(`Connected to the wrong network "${walletNetworkId}". please switch to "${network.id}" in your wallet.`)
			setStatus(WalletConnectionStatus.Error);
		} else if(status !== WalletConnectionStatus.Connected){
			setStatus(WalletConnectionStatus.Connected);

			
            const c = await aeSdk.current.getContractInstance({aci: JSON.parse(ACI), contractAddress}); 
            setContract(c);
            updateAccountBalance();
            updateContractBalance();
		}
	}

	const deleteVoiceRecord = async function (id:string) {
       console.log((await contract.methods.delete_voice_record(parseInt(id)) ).decodedResult)
    }
     
	const answerVoiceQuestion = async function (id:string) {
       console.log((await contract.methods.answer_question(parseInt(id), ans) ).decodedResult)
    }
    

    const updateContractBalance = async function(){
        const balance = (await contract.methods.check_contract_balance()).decodedResult
        console.log(balance);
        setContractBalance(balance);
    }

	const updateVoiceRecord = async function () {
       console.log((await contract.methods.update_voice_record(voiceID, voiceLink, reward, maxReward, answer) ).decodedResult)
    }
    
	const createVoiceRecord = async function () {
        if(!voiceLink || !reward || !maxReward || !answer) {
            alert('Please insert all input');
            return false;
        }

       console.log((await contract.methods.create_voice_record(voiceLink, reward, maxReward, answer) ).decodedResult)
    }
    
	const answerQuestion = async function () {
        console.log((await contract.methods.answer_question() ).decodedResult)
     }

	const depositContract = async function () {
       console.log((await contract.methods.deposit_to_contract({ amount: deposit }) ).decodedResult)
       updateAccountBalance()
       updateContractBalance()
    }
    
	const clearPlayer = async function () {
       console.log((await contract.methods.clear_completed_player()).decodedResult)
    }
    
	const uploadFile = async function () {

        const client = new Web3Storage({ token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDFjMzYzMmY5MmNlOWQ4NTU4QzIyOWFGMzg1ZmM1MDg4ODYyNGVDNzYiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2NjM0Njk5NDQyOTgsIm5hbWUiOiJEZW1vIn0.OE6oIkfAJf24E-MPCrV4jfhPy2fNV4RaJGtWXGKCKg4" })
        const cid = await client.put(selectedFile)
        setVoiceLink("https://" + cid + ".ipfs.w3s.link/" + selectedFile[0].name)

    }

    const handleReward = function( val:string ){
        const value = Math.max(1, Math.min(10000000000000000, Number(val)));
        setReward(value.toString());
    }

	useEffect(() => {
		if (clientReady && client) {
			aeSdk.current = client.current.aeSdk;

      if (!aeSdk.current) return;
			aeSdk.current.onNetworkChange = (params) => fetchAccountDetails(params.networkId);
			fetchAccountDetails(client.current.walletNetworkId);
		}
	}, [clientReady, client]);

	useEffect(() => {
        if(contract)
            getVoiceRecords()
	}, [contract]);



    if(false){

        voiceRecords.forEach((record, index) => {
            arr.push(
              <div key={index}>
                 <b> Link : {record.voice_link} </b>
                 <audio controls>
                <source src={record.voice_link} type="audio/mpeg"/>
                Your browser does not support the audio element.
                </audio>
                 <b> Reward : {parseInt(record.reward)} </b>
                 <b> Max Reward : {parseInt(record.max_reward)} </b>
                 <b> Answer : {record.answer} </b>

                 ANs : <input  type="text" onChange={e => setAns(e.target.value)} />
                 <button onClick={() => {answerVoiceQuestion(record.id)}}>Answer</button> 
                 <button  onClick={() => {deleteVoiceRecord(record.id)}}>Delete</button> 
              </div>
            );
        });

        return (
            <div className="App">
                <header className="App-header">
                    <div>
                        <b> Account Balance </b> 
                    {JSON.stringify(balance)}
                    </div>
                    <div>
                        <b> Contract Balance </b> 
                    {JSON.stringify(contractBalance)}
                    </div>
                    <div>
                        <b> Create voice record </b> 
                        <input type="file" onChange={e => setSelectedFile(e.target.files)} /> 
                        <button onClick={() => uploadFile()}> 
                        Upload! 
                        </button> 
                        Link : <input type='text' onChange={e => setVoiceLink(e.target.value)}/> 
                        Reward : <input type='number' step='0.01' max='0.01' value={reward} onChange={e => handleReward(e.target.value)}/> 
                        Max Reward : <input type='number' onChange={e => setMaxReward(e.target.value)}/> 
                        Answer :
                        <select onChange={e => setAnswer(e.target.value)}>
                            <option value='A'> A</option>
                            <option value='B'> B</option>
                            <option value='C'> C</option>
                        </select>
                        <button onClick={() => createVoiceRecord()}> Create voice record </button>
                    </div>
                    <div>
                        <b> Get all voice record </b> 
                        {arr}
                    </div>
                    <div>
                        <b> Check contract balance </b> 
                        <button onClick={() => updateContractBalance()}> Check contract balance</button>
                    </div>
                    <div>
                        <b> Deposit to contract </b> 
                        Amount : <input type='number' onChange={e => setDeposit(e.target.value)} />
                        <button onClick={() => depositContract()}> Deposit </button> 
                    </div>
                    <div>
                        <button onClick={() => clearPlayer()}> Clear Player Data </button>
                    </div>
                    <div>
                        {status === WalletConnectionStatus.Error &&
                            <div>
                                <img src={logo} alt="logo" />
                                <h6>{errorMsg}</h6>
                            </div>
                        }
                    </div>
                    <div>
                        {status === WalletConnectionStatus.Connected &&
                            <div>
                                <img src={logo} alt="logo" />
                                <h6>Account address: {address}</h6>
                                <h6>Balance: {JSON.stringify(balance)}</h6>
                            </div>
                        }
                    </div>
                </header>
            </div>
        );

    }
    else 
        return (
            <div id='loader'>
                <img src={logoBG} id='logoBg'/>
                <img src={logoBody} id='logoBody'/>
            </div>
        )

};

export default App;
