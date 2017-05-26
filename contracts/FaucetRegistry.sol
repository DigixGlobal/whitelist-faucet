pragma solidity ^0.4.8;

contract FaucetRegistry {

	address public owner;
	uint public cooldown;
	bool public allowUserRedemptions;

	struct Allowance {
		uint amount;
		uint lastUsed;
	}

	mapping (address => Allowance) public allowances;

	event Redeem(address indexed from, address indexed to, uint amount);
	event SetAllowance(address indexed user, uint amount);

	modifier isOwner() {
		if (msg.sender == owner) {
			_;
		}
	}

	function FaucetRegistry(uint _cooldown, bool _allowUserRedemptions) {
		owner = msg.sender;
		cooldown = _cooldown;
		allowUserRedemptions = _allowUserRedemptions;
	}

	function() {
		redeem(msg.sender);
	}

	function fund() isOwner payable { }

	function setAllowance(address _user, uint _allowance) isOwner {
		allowances[_user].amount = _allowance;
		SetAllowance(_user, _allowance);
	}

	function setManyAllowances(uint _allowance, address _0, address _1, address _2, address _4, address _5, address _6, address _7, address _8, address _9) {
		setAllowance(_0, _allowance);
		setAllowance(_1, _allowance);
		setAllowance(_2, _allowance);
		setAllowance(_4, _allowance);
		setAllowance(_5, _allowance);
		setAllowance(_6, _allowance);
		setAllowance(_7, _allowance);
		setAllowance(_8, _allowance);
		setAllowance(_9, _allowance);
	}

	function setOwner(address _owner) isOwner {
		owner = _owner;
	}

	function setCooldown(uint _cooldown) isOwner {
		cooldown = _cooldown;
	}

	function canRedeem(address _user) returns (bool _canRedeem) {
		Allowance allowance = allowances[_user];
		// fail if no balance
		if (allowance.amount <= 0) { return false; }
		// pass if cooldown is not set
		if (allowance.lastUsed == 0) { return true; }
		// fail if cooldown is not passed
		if ((now - cooldown) < allowance.lastUsed) { return false; }
		// it's good to go
		return true;
	}

	// TODO safemath
	function redeem(address _user) isOwner {
		// validate
		if (!canRedeem(_user)) { throw; }
		// get the user
		Allowance allowance = allowances[_user];
		// set the cooldown
		allowances[_user].lastUsed = now;
		// send the allowance if redemptions is allowed
		if (allowUserRedemptions) {
			if (!_user.send(allowance.amount)) { throw; }
		}
		// emit event
		Redeem(_user, msg.sender, allowance.amount);
	}

}
