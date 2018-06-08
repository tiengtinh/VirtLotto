// web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:7545"));

// Checking if Web3 has been injected by the browser (Mist/MetaMask)
if (typeof web3 !== 'undefined') {
  // Use Mist/MetaMask's provider
  web3js = new Web3(web3.currentProvider);
} else {
  console.log('No web3? You should consider trying MetaMask!')
  // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
  web3js = new Web3(new Web3.providers.HttpProvider("http://localhost:9545"));
}

abi = JSON.parse('[{"constant":true,"inputs":[],"name":"MAX_TICKETS_PER_ADDRESS","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"roundCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"number","type":"uint256"}],"name":"pickNumber","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"myid","type":"bytes32"},{"name":"result","type":"string"}],"name":"__callback","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_queryId","type":"bytes32"},{"name":"_result","type":"string"},{"name":"_proof","type":"bytes"}],"name":"__callback","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"kill","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"},{"name":"","type":"uint256"}],"name":"playerTickets","outputs":[{"name":"number","type":"uint256"},{"name":"amount","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"betsPerRound","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"player","type":"address"}],"name":"getPlayerTicketsCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"minBet","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"betCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"MIN_NUMBER","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"players","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"MAX_NUMBER","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"name":"_minBet","type":"uint256"},{"name":"_betsPerRound","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"player","type":"address"},{"indexed":false,"name":"number","type":"uint256"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"NumberPicked","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"winners","type":"address[]"},{"indexed":false,"name":"luckyNumber","type":"uint256"},{"indexed":false,"name":"prize","type":"uint256"}],"name":"RoundConcluded","type":"event"}]')
VotingContract = web3.eth.contract(abi);

// local usingOraclize
// gas used: 3381460
// contractInstance = VotingContract.at('0xf12b5dd4ead5f743c6baa640b0216200e89b60da');

// local pure
// gas used: 1094947
// contractInstance = VotingContract.at('0xf12b5dd4ead5f743c6baa640b0216200e89b60da');

// ropsten pure
// gas used: 1094947
contractInstance = VotingContract.at('0x6e8fbd5f0ae68dfe8fa986a2ff2e711ccec6341b');


function contractGetCall(method, args = []) {
  return new Promise((resolve, reject) => {
    console.log('contractGetCall: ', method, args)
    contractInstance[method](...args, function(err, result) {
      if (err) {
        return reject(err)
      }
      console.log('contractGetCall result:', result)
      resolve(result.c[0])
    })
  })
}

function getContractAccountTicketsCount(account) {
  return new Promise((resolve, reject) => {
    console.log('getContractAccountTicketsCount account:', account)
    contractInstance.getPlayerTicketsCount.call(account, function(err, result) {
      if (err) {
        return reject(err)
      }
      console.log('getContractAccountTicketsCount result:', result)
      resolve(result.c[0])
    })
  })
}

function callPickNumber(number, amount) {
  return new Promise((resolve, reject) => {
    contractInstance.pickNumber(number, {
      // from: web3.eth.accounts[1],
      value: web3.toWei(amount, 'ether'),
      gas: 4712388,
      gasPrice: 100000000000,
      // gasLimit: 21000,
      // gasPrice: web3.toWei(0.2, 'gwei'),
    }, function(err, result) {
      if (err) {
        return reject(err)
      }

      console.log('callPickNumber result:', result)
      resolve(result)
    });
  })
  
  // return contactCall('pickNumber', [number])
}

async function renderSummaryBoard(
  MIN_NUMBER,
  MAX_NUMBER,
  MAX_TICKETS_PER_ADDRESS,
) {
  const account = web3.eth.accounts[0]
  console.log('account: ', account)

  const [
    roundCount,
    minBet,
    betsPerRound,
    ticketsCount,
    betCount,
  ] = await Promise.all([
    contractGetCall('roundCount'),
    contractGetCall('minBet'),
    contractGetCall('betsPerRound'),
    getContractAccountTicketsCount(account),
    contractGetCall('betCount'),
  ])

  console.log('contactGetCall result: ', {
    roundCount,
    minBet,
    betsPerRound,
    ticketsCount,
    betCount,
  })

  $('#roundCount').html(roundCount)
  $('#betsPerRound').html(betsPerRound)
  $('#minBet').html( web3.fromWei(web3.toWei(minBet, 'finney'), 'ether') )
  $('#remainingBetsCount').html(betsPerRound - betCount)
  $('#remainingTicketsCount').html(MAX_TICKETS_PER_ADDRESS - ticketsCount)
}

async function startApp() {
  const [
    MIN_NUMBER,
    MAX_NUMBER,
    MAX_TICKETS_PER_ADDRESS,
  ] = await Promise.all([
    contractGetCall('MIN_NUMBER'),
    contractGetCall('MAX_NUMBER'),
    contractGetCall('MAX_TICKETS_PER_ADDRESS'),
  ])

  await renderSummaryBoard(
    MIN_NUMBER,
    MAX_NUMBER,
    MAX_TICKETS_PER_ADDRESS,
  )

  const $ticketsContainer = $('#tickets')
  const $tickets = $('<div/>')
  for (let i = MIN_NUMBER; i <= MAX_NUMBER; i++) {
    $tickets.append(`<a href="#" onclick="pickNumber(${i})" class="btn btn-primary">${ i }</a>`)
  }
  $ticketsContainer.append($tickets)

  contractInstance.NumberPicked(async function(err, result) {
    if (err) {
      console.error('NumberPicked error: ', err)
      return
    }

    console.log('NumberPicked: ', result)
    await renderSummaryBoard(
      MIN_NUMBER,
      MAX_NUMBER,
      MAX_TICKETS_PER_ADDRESS,
    )
  })

  contractInstance.RoundConcluded(async function(err, result) {
    if (err) {
      console.error('RoundConcluded error: ', err)
      return
    }

    console.log('RoundConcluded: ', result)

    const winners = result.args.winners ? result.args.winners.filter( (address) =>address !== '0x0000000000000000000000000000000000000000') : []

    $('#result').html(`Last round result: <br>
    - lucky number: ${ result.args.luckyNumber.c[0] } <br>
    - winners: [${winners}] <br>
    - per player prize: ${ result.args.prize.c[0] }`)

    await renderSummaryBoard(
      MIN_NUMBER,
      MAX_NUMBER,
      MAX_TICKETS_PER_ADDRESS,
    )
  } )
}

async function pickNumber(number) {
  const amount = parseInt($('#amount').val())

  console.log('number - amount: ', number, amount)
  await callPickNumber(parseInt(number), amount)
}

$(document).ready(function() {
  startApp();
  // RandomExample()
});

function RandomExample() {
  const abi = JSON.parse('[{"constant":false,"inputs":[{"name":"myid","type":"bytes32"},{"name":"result","type":"string"}],"name":"__callback","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_queryId","type":"bytes32"},{"name":"_result","type":"string"},{"name":"_proof","type":"bytes"}],"name":"__callback","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"update","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"","type":"bytes"}],"name":"newRandomNumber_bytes","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"","type":"uint256"}],"name":"newRandomNumber_uint","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"","type":"bytes32"}],"name":"newRandomNumberFired","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"","type":"bytes32"}],"name":"newRandomNumberFail","type":"event"},{"anonymous":false,"inputs":[],"name":"newRandomNumberCalled","type":"event"}]')
  const RandomExampleContact = web3.eth.contract(abi);

  // RandomExample local, no deploy error
  // gas used: 2792948
  // const contractInstance = RandomExampleContact.at('0xf25186b5081ff5ce73482ad761db0eb0d25abfbf');

  // ropsten, deploy error
  // gas used: 3905053
  // call gas limit: 362470 - gas price: 5 gwei
  // oracalize success: https://gyazo.com/50c03f7cf936c3738493504b6439e7ca
  const contractInstance = RandomExampleContact.at('0xe46fbc52f42cafcd8a7c314a080b85e54d1b6570');
  

  contractInstance.newRandomNumber_bytes(function(err, result) {
    console.log('newRandomNumber_bytes', err, result)
  })

  contractInstance.newRandomNumber_uint(function(err, result) {
    console.log('newRandomNumber_uint', err, result)
  })

  contractInstance.newRandomNumberFired(function(err, result) {
    console.log('newRandomNumberFired', err, result)
  })

  contractInstance.newRandomNumberFail(function(err, result) {
    console.log('newRandomNumberFail', err, result)
  })

  contractInstance.newRandomNumberCalled(function(err, result) {
    console.log('newRandomNumberCalled', err, result)
  })

  contractInstance.update(function(err, result) {
    console.log('update', err, result)
  })
}