const User = require('./models/User');
const Exercise = require('./models/Exercise');

const getHome = (req, res) => {
	res.sendFile(__dirname + '/views/index.html');
};

const getUsers = async (req, res) => {
	try {
		const users = await User.find().exec();
		res.json(users);
	} catch (error) {
		res.json({ error: error.message });
	}
};

const postUser = async (req, res) => {
	const username = req.body.username;
	try {
		const newUser = new User({ username });
		newUser.save((err, user) => {
			if (err) throw new Error(err.message);
			else res.json({ username: user.username, _id: user.id });
		});
	} catch (error) {
		res.json({ error: error.message });
	}
};

const postExercise = async (req, res) => {
	const userId = req.params.userId;
	const { description, duration } = req.body;
	let { date } = req.body;
	try {
		const user = await User.findById(userId);
		if (!user) throw new Error('No user found by with id');

		if (!date) date = new Date();
		else {
			const isDate = checkDate(date);
			if (!isDate) throw new Error('This is not a valid date');
			date = new Date(date);
		}

		const isValidDuration = checkDuration(duration);
		if (!isValidDuration)
			throw new Error('The duration must be numbers in minutes');

		const newExercise = new Exercise({
			userId,
			description,
			duration: +duration,
			date
		});
		newExercise.save((err, exercise) => {
			if (err) throw new Error(err.message);
			else
				res.json({
					_id: userId,
					username: user.username,
					date: date.toDateString(),
					duration: +duration,
					description
				});
		});
	} catch (error) {
		res.json({ error: error.message });
	}
};

// test: {"username":"abc","_id":"6288905bc8f4bde4b0dda52a"}
const getLogs = async (req, res) => {
	const userId = req.params.userId;
	try {
		const user = await User.findById(userId);
		if (!user) throw new Error('No user found with that id');

		let exercises = [];
		if (!req.query.to && !req.query.from && !req.query.limit) {
			exercises = await Exercise.find({ userId }).exec();
      sendLogs(res, exercises, user)
    }
		else if (!req.query.to && !req.query.from && req.query.limit) {
			exercises = await Exercise.find({ userId })
				.limit(req.query.limit)
				.exec();
      sendLogs(res, exercises, user)
    }
		else if (!req.query.to && req.query.from && !req.query.limit) {
			if (!checkDate(req.query.from))
				throw new Error('Invalid date in the from field');

      const start = new Date(req.query.from)
			exercises = await Exercise.find({ userId }).where({
				date: { $gte: new Date(req.query.from) }
			});
      sendLogs(res, exercises, user, null, start)
      
		} else if (req.query.to && !req.query.from && !req.query.limit) {
			if (!checkDate(req.query.to))
				throw new Error('Invalid date in the to field');

      const end = new Date(req.query.to)
			exercises = await Exercise.find({ userId }).where({
				date: { $lte: new Date(req.query.to) }
			});
      sendLogs(res, exercises, user, end)
      
		} else if (req.query.to && req.query.from && !req.query.limit) {
			if (!checkDate(req.query.to) || !checkDate(req.query.from))
				throw new Error('Invalid date in the to field');

      const start = new Date(req.query.from)
      const end = new Date(req.query.to)
			exercises = await Exercise.find({ userId }).where({
				date: { $lte: end, $gte: start }
			});
      sendLogs(res, exercises, user, end, start)
      
		} else if (req.query.to && !req.query.from && req.query.limit) {
			if (!checkDate(req.query.to))
				throw new Error('Invalid date in the to field');

      const end = new Date(req.query.to)
			exercises = await Exercise.find({ userId })
				.where({ date: { $lte: end } })
				.limit(req.query.limit);
      sendLogs(res, exercises, user, end)
      
		} else if (!req.query.to && req.query.from && req.query.limit) {
			if (!checkDate(req.query.from))
				throw new Error('Invalid date in the from field');
      
      const start = new Date(req.query.from)
			exercises = await Exercise.find({ userId })
				.where({ date: { $gte: start } })
				.limit(req.query.limit);
      sendLogs(res, exercises, user, null, start)
      
		} else if (req.query.to && req.query.from && req.query.limit) {
			if (!checkDate(req.query.to) || !checkDate(req.query.from))
				throw new Error('Invalid date in the to field');
      
      const start = new Date(req.query.from)
      const end = new Date(req.query.to)
			exercises = await Exercise.find({ userId })
				.where({
					date: { $lte: end, $gte: start }
				})
				.limit(req.query.limit);
      sendLogs(res, exercises, user, end, start)
		}
		// console.log(userId, exercises)
	} catch (error) {
		res.json({ error: error.message });
	}
};

//FCC site: userid: 628893317a0fcc06ac75abdd
// result {"_id":"628893317a0fcc06ac75abdd","username":"123","count":3,"log":[{"description":"test3","duration":12,"date":"Tue Dec 01 2020"},{"description":"test","duration":10,"date":"Thu Oct 01 2020"},{"description":"test2","duration":10,"date":"Sat Jan 01 2000"}]}

const sendLogs = (res, exercises, user, Qto = null, Qfrom = null) => {
	const response = {
		_id: user.id,
		username: user.username,
	};
  if(Qto) response.to = Qto.toDateString()
  if(Qfrom) response.from = Qfrom.toDateString()
  response.count = exercises.length
	if (exercises.length === 0) response.log = []
	else if (exercises.length > 0) response.log = formatLogs(exercises)	

	res.json(response);
};

const checkDate = date => /^\d{4}[-]\d{1,2}[-]\d{1,2}/.test(date);
const checkDuration = duration => /^\d*$/.test(duration);
const formatLogs = exercises =>
	exercises.map(({ description, duration, date }) => ({
		description,
		duration,
		date: date.toDateString()
	}));

module.exports = {
	getHome,
	getUsers,
	postUser,
	postExercise,
	getLogs
};
