pragma solidity ^0.4.21;

// import "./oraclizeAPI.sol";

//deploy to ropsten test net: https://dapps.oraclize.it/browser-solidity/#version=soljson-v0.4.21+commit.dfe3193c.js
// import "github.com/oraclize/ethereum-api/oraclizeAPI.sol";

contract VirtLotto {
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

  event NumberPicked(address player, uint number, uint amount);
  event RoundConcluded(address[] winners, uint luckyNumber, uint prize);

  function VirtLotto(uint _minBet, uint _betsPerRound) public {
    // oraclize_setProof(proofType_Ledger); // sets the Ledger authenticity proof in the constructor

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
      finalizeRound();
    }

    emit NumberPicked(msg.sender, number, msg.value);
  }

  function finalizeRound() private { // can this be private because it shouldn't be called by outsider, only call internally by pickNumber
    uint luckyNumber = getLuckyNumber(); // need memory?
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
