# VirtLotto

Coderschool Week 1 Project: VirtLotto

## Local testing contract deployment

Enter node REPL by type `node`, then execute following script:

```javascript
// deployment for base requirements

Web3 = require('web3')
web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:7545")) // Check for the right port number
solc = require('solc');

code = fs.readFileSync('VirtLotto.sol').toString();
compiledCode = solc.compile(code);
VotingContract = web3.eth.contract(JSON.parse(compiledCode.contracts[':VirtLotto'].interface))

byteCode = compiledCode.contracts[':VirtLotto'].bytecode

deployedContract = VotingContract.new(
    1000, 5,
    {
        data: byteCode, 
        from: web3.eth.accounts[0],
        gas: 1200000
    })
contractInstance = VotingContract.at(deployedContract.address)

```

```javascript
// deployment with usingOraclize

Web3 = require('web3')
web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:7545")) // Check for the right port number
solc = require('solc');

var inputs = {
    'usingOraclize.sol': fs.readFileSync('usingOraclize.sol').toString(),
    'VirtLotto.sol': fs.readFileSync('VirtLotto.sol').toString(),
};

// Assumes imported files are in the same folder/local path
function findImports(path) {
    return {
        'contents': fs.readFileSync(path).toString()
    }
}

compiledCode = solc.compile({sources: inputs}, 1, findImports)

VotingContract = web3.eth.contract(JSON.parse(compiledCode.contracts['VirtLotto.sol:VirtLotto'].interface))

byteCode = compiledCode.contracts['VirtLotto.sol:VirtLotto'].bytecode

deployedContract = VotingContract.new(
    1000, 1,
    {
        data: byteCode, 
        from: web3.eth.accounts[0],
        gas: 5200000
    })
contractInstance = VotingContract.at(deployedContract.address)
abi = compiledCode.contracts['VirtLotto.sol:VirtLotto'].interface
```