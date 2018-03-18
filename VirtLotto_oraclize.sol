pragma solidity ^0.4.21;

// import "./usingOraclize.sol";

//deploy to ropsten test net: https://dapps.oraclize.it/browser-solidity/#version=soljson-v0.4.21+commit.dfe3193c.js
import "github.com/oraclize/ethereum-api/oraclizeAPI.sol";

// contract VirtLotto {
contract VirtLotto is usingOraclize {
  uint public constant MIN_NUMBER = 1;
  uint public constant MAX_NUMBER = 10;

  uint public constant MAX_TICKETS_PER_ADDRESS = 4;

  address public owner;

  uint public minBet; // X in finney
  uint public betsPerRound; // Y

  struct Ticket {
    uint number;
    uint amount;
  }

  address[] public players;
  mapping(address => Ticket[]) public playerTickets;
  uint public betCount = 0;

  uint public roundCount = 0;

  bool private expectingLuckyNumber = false;

  event NumberPicked(address player, uint number, uint amount);
  event RoundConcluded(address[] winners, uint luckyNumber, uint prize);

  function VirtLotto(uint _minBet, uint _betsPerRound) public {
    // OAR = OraclizeAddrResolverI(0x6f485C8BF6fc43eA212E93BBF8ce046C7f1cb475);

    owner = msg.sender;

    minBet = _minBet;
    betsPerRound = _betsPerRound;
  }

  function getPlayerTicketsCount(address player) public view returns (uint) {
    Ticket[] memory tickets = playerTickets[player];
    return tickets.length;
  }

  function pickNumber(uint number) public payable {
    require(MIN_NUMBER <= number && number <= MAX_NUMBER);
    require(msg.value >= minBet);
    require(playerTickets[msg.sender].length < MAX_TICKETS_PER_ADDRESS);

    // if sender first time bet, add to list to track list of players
    if (playerTickets[msg.sender].length == 0) {
      players.push(msg.sender);
    }

    playerTickets[msg.sender].push(Ticket({
      number: number,
      amount: msg.value
    }));

    betCount++;
    bool endOfRound = betCount >= betsPerRound;
    if (endOfRound) {
      requestLuckyNumber();
      // uint luckyNumber = getLuckyNumber();
      // finalizeRound(luckyNumber);
    }

    emit NumberPicked(msg.sender, number, msg.value);
  }

  function finalizeRound(uint luckyNumber) private {
    address[] memory winners;
    uint count;
    (winners, count) = getWinners(luckyNumber);
    uint prize = 0;
    if (count > 0) {
      prize = address(this).balance / winners.length;
      distributePrize(prize, winners, count);
    }
    emit RoundConcluded(winners, luckyNumber, prize);
    nextRound();
  }

  function __callback(bytes32 _queryId, string _result, bytes _proof)
  {
    require(expectingLuckyNumber == true);
    // if we reach this point successfully, it means that the attached authenticity proof has passed!
    require (msg.sender == oraclize_cbAddress());
    if (oraclize_randomDS_proofVerify__returnCode(_queryId, _result, _proof) != 0) {
      // the proof verification has failed, do we need to take any action here? (depends on the use case)
    } else {
      // the proof verification has passed
      expectingLuckyNumber = false;
      // for simplicity of use, let's also convert the random bytes to uint if we need
      uint maxRange = MAX_NUMBER - 1; // this is the highest uint we want to get. It should never be greater than 2^(8*N), where N is the number of random bytes we had asked the datasource to return
      uint randomNumber = uint(sha3(_result)) % maxRange; // this is an efficient way to get the uint out in the [0, maxRange] range

      uint luckyNumber = randomNumber + 1;

      finalizeRound(randomNumber);
    }
  }

  function requestLuckyNumber() private {
    oraclize_setProof(proofType_Ledger); // sets the Ledger authenticity proof
    expectingLuckyNumber = true;

    uint N = 7; // number of random bytes we want the datasource to return
    uint delay = 0; // number of seconds to wait before the execution takes place
    uint callbackGas = 200000; // amount of gas we want Oraclize to set for the callback function
    bytes32 queryId = oraclize_newRandomDSQuery(delay, N, callbackGas); // this function internally generates the correct oraclize_query and returns its queryId
  }

  function getLuckyNumber() private view returns (uint) {
    return uint8(uint256(keccak256(block.timestamp, block.difficulty))%10);
    // return 2; NOTE: for testing
  }

  function getWinners(uint luckyNumber) private view returns (address[] memory winners, uint count) {
    winners = new address[](players.length);

    for (uint i = 0; i < players.length; i++) {
      if (isWinner(luckyNumber, players[i])) {
        winners[count] = players[i];
        count++;
      }
    }

    return (winners, count);
  }

  function isWinner(uint luckyNumber, address player) private view returns (bool) {
     Ticket[] memory tickets = playerTickets[player];
     for (uint i = 0; i < tickets.length; i++) {
       if (tickets[i].number == luckyNumber) {
         return true;
       }
     }

     return false;
  }

  function distributePrize(uint prize, address[] winners, uint count) private {
    for (uint i = 0; i < count; i++) {
      winners[i].transfer(prize);
    }
  }

  function nextRound() private {
    for (uint i = 0; i < players.length; i++) {
      delete playerTickets[players[i]];
    } 

    players.length = 0;

    betCount = 0;

    roundCount++;
  }

  function kill() public {
    if (msg.sender == owner) {
      selfdestruct(owner);
    }
  }
}
