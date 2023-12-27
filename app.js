import express from "express";
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
const { Schema } = mongoose;
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
import {dirname} from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(express.static("public"));
app.set("view engine","ejs");
app.use(express.json());

mongoose.connect("mongodb+srv://gopika30:beYourself@cluster0.ija6j8j.mongodb.net/eventManagement", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to MongoDB successfully");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });
//schemas
const loginSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    number: { type:String, required: true, unique: true},
    type: { type: String, enum: ['admin', 'eventCoordinator', 'participant'], required: true },
    userID: { type: String, required: true, unique: true },
    psw: { type: String, required: true }
}, { collection: 'loginInfo' });
const Login = mongoose.model('Login', loginSchema);
const contentSchema = new mongoose.Schema({
  page:  String,
  mainHead: String,
  subHead1: String, 
},{ collection: 'contents' });
const Content = mongoose.model('Content', contentSchema);
const eventSchema = new mongoose.Schema({
    category: { type: String, required: true },
    title: { type: String, default: "Event name" },
    catchy: { type: String, default: "Event catchy" },
    rootURL: { type: String, default: "Event rootURL" },
    eventDescription: { type: String, default: "Event description" },
    eventMode: { type: String, default: "Event mode" },
    eventRules: { type: [String], default: ["Rule1","Rule2"] },
    eventVenue: { type: String, default: "Event venue" },
    eventDate: { type: String, default: "Event date" },
    eventCoordinatorName: { type: String, default: "Event co-ordinator name" },
    eventCoordinatorNumber: { type: String, default: "Event co-ordinator number" },
    eventTime: { type: String, default: "Event time" },
    eventCoordinatorMailID: { type: String, default: "eventCoOrdinator@gmail.com" },
    eventRegisterationLink: { type: String, default: "https://www.google.com/" },
},{ collection: 'eventInfo' });
const Event = mongoose.model('Event', eventSchema);
app.get("/",async function(req,res){
  const content = await Content.findOne({ page: 'landing page' });
  res.render('landingPage', { content1: content.mainHead, content2: content.subHead1 });
});
app.get('/signup', (req, res) => {
  res.sendFile(__dirname + "/public/html/signup.html");
});

app.post('/signup', async (req, res) => {
  try {
    const { fullName,number, email, userID, psw } = req.body;
    const existingUser = await Login.findOne({ userID });
    if (existingUser) {
      return res.status(400).json({ error: 'User ID already exists. Please choose a different one.' });
    }
    const newUser = new Login({ fullName, email, number, type: "participant", userID, psw});
    await newUser.save();
    res.json({ message: 'Account created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});
app.get('/login', (req, res) => {
  res.sendFile(__dirname + "/public/html/login.html");
});
app.post('/login', async (req, res) => {
  try {
      const { userID, psw, userType } = req.body;
      const user = await Login.findOne({ userID });
      if (!user) {
          return res.status(401).json({ error: 'User not found' });
      }
      if (user.psw !== psw) {
          return res.status(401).json({ error: 'Incorrect password' });
      }
      if (user.type !== userType) {
          return res.status(401).json({ error: 'Incorrect user type' });
      }
      let redirectUrl;
      if (userType === 'admin') {
          redirectUrl = '/admin';
      } else if (userType === 'eventCoordinator') {
          redirectUrl = '/coordinator';
      } else {
          redirectUrl = '/participant';
      }
      res.json({ redirect: `${redirectUrl}?userID=${userID}` });
  } catch (error) {
      res.status(500).json({ error: 'An error occurred' });
  }
});
// admin pannel
app.get('/admin/', async (req, res) => {
  try {
    const content = await Content.findOne({ page: 'header' });
    const userID = req.query.userID;
    const events = await Event.find();
    const eventCoordinators = await Login.find({ type: 'eventCoordinator' }, 'fullName');
    res.render('adminEvents', {userID:userID, events, eventCoordinators, content1: content.mainHead, content2: content.subHead1 }); 
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).send('Internal Server Error');
  }
});
app.get('/admin/landingPage', async (req, res) => {
  try {
    const contentH = await Content.findOne({ page: 'header' });
    const userID = req.query.userID;
    const content = await Content.findOne({ page: 'landing page' });
    res.render('adminEditable', {userID:userID, content, content1: contentH.mainHead, content2: contentH.subHead1 }); 
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).send('Internal Server Error');
  }
});
app.get('/admin/header', async (req, res) => {
  try {
    const content = await Content.findOne({ page: 'header' });
    const userID = req.query.userID;
    res.render('adminEditable', {userID:userID, content, content1: content.mainHead, content2: content.subHead1 }); 
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).send('Internal Server Error');
  }
});
app.get('/addEvent', async (req, res) => {
  try {
    const categories = await Event.distinct('category');
    const eventCoordinators = await Login.find({ type: 'eventCoordinator' }, 'fullName');
    res.json({ categories, eventCoordinators });
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});
app.post('/addEvent', async (req, res) => {
  try {
    var { eventName, category, newCategory, eventCoordinator } = req.body;
    if (category === 'New') {
      category = newCategory;
    }
    const lst = eventName.split(" ");
    const toTitleCase = (str) => {
      return str
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };
    const formattedEventName = toTitleCase(eventName);
    const formattedCategory = toTitleCase(category);
    const rootURL = lst.join('-').toLowerCase();
    const coordinator = await Login.findOne({ fullName: eventCoordinator });
    const newEvent = new Event({
      category: formattedCategory,
      title: formattedEventName,
      eventCoordinatorName: eventCoordinator,
      eventCoordinatorNumber: coordinator.number,
      eventCoordinatorMailID: coordinator.email,
      rootURL: rootURL
    });
    await newEvent.save();
    coordinator.events.push(newEvent._id.toString());
    await coordinator.save();
    res.redirect(req.get('referer'));
  } catch (error) {
    console.error('Error adding event:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/addUser', async function(req, res){
  const { fullName, email, number, type, userID, psw} = req.body;
  try {
    const newUser = new Login({ fullName, email, number, type, userID, psw });
    await newUser.save();
    res.redirect(req.get('referer'));
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});
app.get('/events', async function (req, res) { 
  try {
    const events = await Event.find(); 
    res.json({ events });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.post('/deleteEvent', async (req, res) => {
  const selectedEventIds = req.body.selectedEvents;

  try {
    await Event.deleteMany({ _id: { $in: selectedEventIds } });
    const coordinators = await Login.find({ events: { $in: selectedEventIds } });
    for (const coordinator of coordinators) {
      coordinator.events = coordinator.events.filter(eventId => !selectedEventIds.includes(eventId));
      await coordinator.save();
      res.redirect(req.get('referer'));
    }
    
  } catch (error) {
    console.error('Error deleting events:', error);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/adminUsers', async function (req, res){
  try {
    const adminUsers = await Login.find({ type: 'admin', userID: { $ne: 'gopika04' } });
    res.json({ adminUsers });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.get('/coordinatorUsers', async function (req, res){
  try {
    const coordinatorUsers = await Login.find({ type: 'eventCoordinator'});
    res.json({ coordinatorUsers });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.post('/deleteAdminUser', async function(req, res){
  const selectedUserIds = req.body.selectedUsers;
  try {
    await Login.deleteMany({ _id: { $in: selectedUserIds } });
    res.redirect(req.get('referer'));
  } catch (error) {
    console.error('Error deleting users:', error);
    res.status(500).send('Internal Server Error');
  }
});
app.post('/deleteCoordinatorUser', async function(req, res){
  var selectedUserIds = []
  selectedUserIds = selectedUserIds.concat(req.body.selectedUsers);
  try {
    for (const userId of selectedUserIds) {
      const coordinator = await Login.findById(userId);
      const eventIds = coordinator.events;
      await Event.deleteMany({ _id: { $in: eventIds } });
    }
    await Login.deleteMany({ _id: { $in: selectedUserIds } });
    res.redirect(req.get('referer'));
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});
app.post('/updateContent', async (req, res) => {
  const { id, attribute, newContent, type } = req.body;
  try {
    let document;
    let modelName;
    if (type === 'content') {
      modelName = 'Content';
      document = await Content.findById(id);
    } else if (type === 'event') {
      modelName = 'Event';
      document = await Event.findById(id);
    }
    document[attribute] = newContent;
    await document.save();
    return res.status(200).json({ message: `${modelName} updated successfully` });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/getEventDetails/:eventId', async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const event = await Event.findById(eventId);
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.post('/updateEvent/:eventId', async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const data = req.body;
    const event = await Event.findById(eventId);
    if (event.eventCoordinatorName !== data.eventCoordinatorName) {
      const previousCoordinator = await Login.findOne({ fullName: event.eventCoordinatorName });

      if (previousCoordinator) {
        const eventIndex = previousCoordinator.events.indexOf(eventId);

        if (eventIndex !== -1) {
          previousCoordinator.events.splice(eventIndex, 1);
          await previousCoordinator.save();
        }
      }

      const newCoordinator = await Login.findOne({ fullName: data.eventCoordinatorName });

      if (newCoordinator) {
        newCoordinator.events.push(eventId);
        await newCoordinator.save();
        event.eventCoordinatorName = newCoordinator.fullName;
        event.eventCoordinatorNumber = newCoordinator.number;
        event.eventCoordinatorMailID = newCoordinator.email;
      }
    }

    const lst = data.title.split(" ");
    event.category = data.category;
    event.rootURL = lst.join('-').toLowerCase();
    event.title = data.title;
    event.catchy = data.catchy;
    event.eventDescription = data.eventDescription;
    event.eventMode = data.eventMode;
    event.eventRules = data.eventRules;
    event.eventVenue = data.eventVenue;
    event.eventDate = data.eventDate;
    event.eventTime = data.eventTime;
    event.eventRegisterationLink = data.eventRegisterationLink;

    await event.save();

    res.json({ message: 'success' });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



app.get('/participant/', async (req, res) => {
  try {
    const userID = req.query.userID;
    const content = await Content.findOne({ page: 'header' });
    const user = await Login.findOne({ userID: userID }).exec();
    if (user) {
      const events = await Event.find().exec(); 
      res.render('participantEvents', { userID:userID, user, events ,content1: content.mainHead, content2: content.subHead1 });
    } else {
      console.log('User not found');
      res.status(404).send('User not found');
    }
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});
app.get('/participant/:rootURL', async (req, res) => {
  const rootURL = req.params.rootURL;
  const userID = req.query.userID;
  const user = await Login.findOne({ userID: userID }).exec();
  console.log(userID);
  const content = await Content.findOne({ page: 'header' });
  const event = await Event.findOne({ rootURL: rootURL });
  res.render('participantEventPage', { event, userID:userID,user, content1: content.mainHead, content2: content.subHead1});
});

app.get('/coordinator/', async function(req, res){
  try {
    const userID = req.query.userID;
    const content = await Content.findOne({ page: 'header' });
    const user = await Login.findOne({ userID: userID }).exec();
    if (user) {
      const events = await Event.find().exec(); 
      res.render('coordinatorAllEvents', { userID:userID, user, events,content1: content.mainHead, content2: content.subHead1 });
    } else {
      console.log('User not found');
      res.status(404).send('User not found');
    }
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});
app.get('/coordinator/events', async (req, res) => {
  try {
    const userID = req.query.userID;
    const content = await Content.findOne({ page: 'header' });
    const user = await Login.findOne({ userID: userID }).exec();
    const events = await Event.find();
    const eventCoordinators = await Login.find({ type: 'eventCoordinator' }, 'fullName');
    res.render('coordinatorMyEvents', {userID:userID, user, events, eventCoordinators ,content1: content.mainHead, content2: content.subHead1}); 
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).send('Internal Server Error');
  }
});






app.listen(2000, function(){
    console.log("Server running on port 2000");
}); 