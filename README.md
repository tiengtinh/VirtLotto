# VirtLotto

Coderschool Week 1 Project: VirtLotto

## Local testing deployment

Enter node REPL by type `node`, then execute following script:

```javascript

Web3 = require('web3')
web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:7545")) // Check for the right port number
solc = require('solc');

code = fs.readFileSync('VirtLotto.sol').toString();
compiledCode = solc.compile(code);
VotingContract = web3.eth.contract(JSON.parse(compiledCode.contracts[':VirtLotto'].interface))

byteCode = compiledCode.contracts[':VirtLotto'].bytecode

deployedContract = VotingContract.new(
    1000, 3,
    {
        data: byteCode, 
        from: web3.eth.accounts[0],
        gas: 1200000
    })
contractInstance = VotingContract.at(deployedContract.address)

```
