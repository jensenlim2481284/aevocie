
import Modal from 'react-modal';
import Slider from "react-slick";
import { Web3Storage } from 'web3.storage'
import network from "./configs/network";
import useAeternitySDK from './hooks/useAeternitySDK';
import React, { MutableRefObject, useEffect, useRef, useState } from 'react';
import { AeSdkAepp, AE_AMOUNT_FORMATS, AeSdk, Node, MemoryAccount } from '@aeternity/aepp-sdk';

import './App.css';
import logo from './assets/logo.png';
import logoBG from './assets/logo.gif';
import "slick-carousel/slick/slick.css";
import Circle1 from "./assets/circle1.png";
import Circle2 from "./assets/circle2.png";
import "slick-carousel/slick/slick-theme.css";
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
    const voiceArr = [];
    const ACIJson = JSON.stringify(EncodedACI);
	const [contract, setContract] = useState<any>("")
	const [voiceRecords, setVoiceRecords] = useState<any>("")
	const [voiceArrCheck, setVoiceArrCheck] = useState<string>(null)

    // Slider setting 
    let sliderRef = React.useRef(null);
    const settings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1
    };

    // Voice setting 
    let SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    let SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;
    let control = ['play', 'next', 'previous', 'stop', 'repeat', 'a', 'b', 'c', 'd', 'e', 'f'];
    let grammar = '#JSGF V1.0; grammar control; public <control> = ' + control.join(' | ') + ';';
    let recognition = new SpeechRecognition()
    let recognitionList = new SpeechGrammarList()
    recognitionList.addFromString(grammar, 1)
    recognition.grammars = recognitionList
    recognition.lang = 'en-US'
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    // Modal state 
    const [msg, setMsg] = useState<string>('');
    const [modalIsOpen, setIsOpen] = useState(true);
    const [answerModal, setAnswerModal] = useState(false);

    // Modal function 
    function openModal() {  setIsOpen(true); setAnswerModal(true);}
    function closeModal() {  setIsOpen(false); setAnswerModal(false);}

    // Smart contract method - get voice records 
	const getVoiceRecords = async function () {
        let result = (await contract.methods.get_voice_records()).decodedResult;
        console.log(result);
        setVoiceRecords(result)
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

    // Answer question
	const answerVoiceQuestion = async function (id:string, ans:string) {     
        console.log(id);   
        console.log(ans.toUpperCase());   
        let result = (await contract.methods.answer_question(parseInt(id), ans.toUpperCase()) ).decodedResult;
        console.log(result);
        if(result) setMsg("It's correct !");
        else setMsg("Aww... try again tomorrow");
        setTimeout(() => {
            setAnswerModal(false);
        }, 1000);
        updateAccountBalance();
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
            getVoiceRecords()
        }
	}, [contract]);


    if(voiceRecords){

        // Start recognize voice & voice control handling
        recognition.start()
        recognition.onresult = (event) => {
  
            let word = event.results[0][0].transcript
            let audio =  document.querySelector(
                '.slick-current .audio-control',
              ) as HTMLAudioElement  | null;
            let a = sliderRef?.current;

            switch (word) {
                case 'play':
                    audio.play();
                    break;
                case 'stop':
                    audio.pause();
                    break;
                case 'repeat':
                    audio.load();
                    audio.play();
                    break;
                case 'next':
                    if(a) a?.slickNext();
                    break;
                case 'previous':
                    if(a) a?.slickPrev();
                    break;
                default:
                    console.log(word);
                    if(word == 'see') word = 'c';
                    if(word == 'seen') word = 'c';
                    if(word == 'seek') word = 'c';
                    if(word !=='c' && word !=='b' && word !=='a' && word !=='d' && word !=='e' && word !=='f') return false;
                    let input =  document.querySelector(
                        '.slick-current .voiceID',
                    ) as HTMLInputElement  | null;
                    setMsg('Validating Answer');
                    setAnswerModal(true);
                    answerVoiceQuestion(input.value, word);
                    break;
            }

            recognition.onerror = function (event) {};
            recognition.onend = function() {
                recognition.start();
            };
        }

        voiceRecords.forEach((record, index) => {
            if(voiceArrCheck === null )
                setVoiceArrCheck('1');
            voiceArr.push(
              <div className='voice-item' key={index}>
                    <input type='hidden' className='voiceID' value={parseInt(record.id)}/>
                    <div> <p> Reward </p> <b> Æ {parseFloat(record.reward)/ aenumber} </b></div>
                    <audio controls className='audio-control'>
                        <source src={record.voice_link} type="audio/mpeg"/>
                        Your browser does not support the audio element.
                    </audio>
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
                            <a className='balance' href='#' > Account balance : Æ {parseFloat(balance).toFixed(5)} </a>
                        </div>
                    </header>
                    <div className='App-body'>
                        <div id='imageWrapperContainer'>
                            <div id="imageWrapper">
                                <img id='circle1' src={Circle1} />
                                <img id='circle4' src={Circle1} />
                                <img id='circle3' src={Circle1} />
                                <img id='circle2' src={Circle2} />
                                <div id='homeImage'>
                                    <img src={HeaderImage}  />
                                </div>
                            </div>
                        </div>
                        <div id='voiceRecords'>
                            <div id='voiceArrsection'>
                                {voiceArrCheck === null ? 
                                    <b id='noAd'> There is no ad content yet.  </b>
                                    : <Slider  ref={sliderRef} {...settings}> {voiceArr}  </Slider>
                                }
                            </div>
                          
                        </div>
                        
                    </div>
                </div>
                <Modal closeTimeoutMS={500} isOpen={modalIsOpen} onRequestClose={closeModal}>
                    
                    <h2> Quick Walkthrough </h2>
                    <p> You have to use voice input to control the system. The following is a list of Æ Voice command  : </p>
                    <p className='l'>
                            - play : to start reading the ads content to the audience <br/>
                            - repeat : to repeat reading the ads content <br/>
                            - stop : pause the reading <br/>
                            - next : next ads content <br/>
                            - previous : previous ads content <br/>
                            - A - F  : to answer multiple choice question  
                    </p>
                    <div className='c'>
                        <button onClick={() => setIsOpen(false)}> Got it </button>
                    </div>
                </Modal>
                <Modal closeTimeoutMS={500} isOpen={answerModal} onRequestClose={closeModal}>
                    <div className="span-container">
                        <span className="one"></span>
                        <span className="two"></span>
                        <span className="three"></span>
                        <span className="four"></span>
                    </div>
                    <h3> {msg} </h3>
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
