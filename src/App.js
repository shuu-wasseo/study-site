import './App.css';
import { useState, useEffect } from 'react' 
import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { useCookies } from 'react-cookie';

const firebaseConfig = {
  apiKey: "AIzaSyDtM_T9fJt4miiDDYkkWJg3XynMwWBFBMg",
  authDomain: "study-8289d.firebaseapp.com",
  databaseURL: "https://study-8289d-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "study-8289d",
  storageBucket: "study-8289d.appspot.com",
  messagingSenderId: "906722849841",
  appId: "1:906722849841:web:644725a219466d036a5110",
  measurementId: "G-43P6V2WZMS"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

function Body(props) {
  const [cookies, setCookie, removeCookie] = useCookies();
  const [loggedIn, setLoggedIn] = useState(cookies.loggedIn)
  const [username, setUsername] = useState("")

  console.log(props.tab)

  const [users, setUsers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    switch (props.tab) {
      case 3:
        async function fetchData() {
          try {
            await getDocs(collection(db, "users")).then((data) => {
              console.log("data", data.data())
              setUsers(data)
            });
            //setUsers(data);
            //setLoading(false);
          } catch (error) {
            console.log("catch")
            setError(error);
            setLoading(false);
          }
        }
        fetchData()
    }
  }, []);

  function logIn(formData, users) {
    console.log("logging in")
    for (let user in users) {
      console.log(user)
      if (user.data().username == formData.get("username")) {
        console.log("yass")
      }
    }
  }

  if (!loggedIn && props.tab !== 3) {
    setCookie("loggedIn", "")
    return (
      <div className="body">
        um... i think you should probably log in or sign up
      </div>
    )
  } else {
    switch (props.tab) {
      case 3:
        return (
          <form action={(e) => {e.preventDefault(); alert("preventing default"); logIn(e, users)}}>
            <label>
              username: <input type="text" name="username" />
            </label>
            <label>
              password: <input type="text" name="password" />
            </label>
            <input type="submit" value="submit" className="button" />
          </form>
        )
    }
  }
}

function App() {
  const [cookies, setCookie, removeCookie] = useCookies();
  const [loggedIn, setLoggedIn] = useState(cookies.loggedIn)
  const [tab, setTab] = useState(0)

  const navbar = (
    <div className="navbar">
      <div className="header left">
        <button className="header-children">logo</button>
        <button className="header-children">subjects</button> 
        <button className="header-children">stats</button> 
      </div>
      <div className="header right">
        {loggedIn ? <button className="header-children">account</button> : <button className="header-children" onClick={() => {setTab(3); console.log("tab")}}>log in / sign up</button>}
      </div>
    </div>
  )

  return (
    <div className="App">
      <script src="https://www.gstatic.com/firebasejs/10.6.0/firebase-app-compat.js"></script>
      <script src="https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore-compat.js"></script>
      {navbar}
      <Body tab={tab}/>
    </div>
  );
}

export default App;
