import './App.css'

import { useState, useEffect } from 'react' 
import Cookies from 'js-cookie'

import { initializeApp } from 'firebase/app'
import { 
  getFirestore, collection, getDocs, doc, setDoc, deleteDoc, updateDoc 
} from "firebase/firestore"

import { sha256 } from 'js-sha256'

import Select from 'react-select'

const firebaseConfig = {
  apiKey: "AIzaSyDtM_T9fJt4miiDDYkkWJg3XynMwWBFBMg",
  authDomain: "study-8289d.firebaseapp.com",
  databaseURL: "https://study-8289d-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "study-8289d",
  storageBucket: "study-8289d.appspot.com",
  messagingSenderId: "906722849841",
  appId: "1:906722849841:web:644725a219466d036a5110",
  measurementId: "G-43P6V2WZMS"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

function todaysDate() {
  const date = new Date()

  let day = date.getDate()
  let month = date.getMonth() + 1
  let year = date.getFullYear()
  let currentDate = `${year}-${month}-${day}`
  return currentDate
}

async function fetchData(params, func, setLoading, setError, loading, purpose) {
  try {
    const ncollection = await getDocs(
      collection(db, "users/" + params.join("/"))
    )
    let modifiedCollection = []
    ncollection.forEach((docu) => {
      modifiedCollection.push(docu.data())
    })
    try {
      func(modifiedCollection)
      setLoading(false)
    } catch {}
    return modifiedCollection
  } catch (error) {
    console.error(error)
    try {
      setError(error)
      setLoading(false)
    } catch {}
  }
}

async function subjectTotal(username, group, subject, addedModule = { id: "" }, quantity) {
  if (group.id && subject.id) {
    const collection = await fetchData([
      sha256(username), "groups",
      sha256(group.name), "subjects",
      sha256(subject.name), "modules"
    ]);

    let totalScore = 0;
    let totalWeightage = 0;

    for (let item of collection) {
      totalWeightage += item.weightage;
      if (item.id === addedModule.id) {
        totalScore += quantity * item.weightage;
      } else {
        totalScore += item.tier * item.weightage;
      }
    }

    return totalWeightage !== 0 ? (totalScore / totalWeightage) * 100 : 0;
  } else {
    return "?";
  }
}

async function groupTotal(username, group, addedSubject={ id:"" }, addedModule = { id: "" }, quantity) {
  if (group.id) {
    const collection = await fetchData([
      sha256(username), "groups",
      sha256(group.name), "subjects",
    ]);

    let totalScore = 0;
    let totalWeightage = 0;

    for (let item of collection) {
      totalWeightage += item.weightage;
      if (item.id === addedSubject.id) {
        totalScore += await subjectTotal(username, group, item, addedModule={id: addedModule.id}, quantity) * item.weightage;
      } else {
        totalScore += await subjectTotal(username, group, item) * item.weightage;
      }
      console.log("check", totalScore, totalWeightage)
    }

    return totalWeightage !== 0 ? (totalScore / totalWeightage) : 0;
  } else {
    return "?";
  }
}

function checkLoggedIn(users, cookie) {
  if (!cookie) {
    return false
  }
  try {
    JSON.parse(cookie)
  } catch {
    return false
  }
  if (users) {
    let found = false
    users.forEach(user => {
      if (JSON.parse(cookie).password === user.account.password) {
        found = found || true
      }
    })
    return found
  } else {
    return false
  }
}

function checkUsername(users, cookie) {
  if (!cookie) {
    return "No username found"
  }
  try {
    JSON.parse(cookie)
  } catch {
    return false
  }
  if (users) {
    let found = "No username found"
    users.forEach(user => {
      if (JSON.parse(cookie).password === user.account.password) {
        found = user.account.username
      }
    })
    return found
  } else {
    return "No username found"
  }
}

function getCurrentUser(users, cookie) {
  if (!cookie) {
    return "No username found"
  }
  try {
    JSON.parse(cookie)
  } catch {
    return false
  }
  let foundUser = {}
  if (users) {
    users.forEach(user => {
      if (JSON.parse(cookie).password === user.account.password) {
        foundUser = user
      }
    })
  } 
  return foundUser
}

function editGroup(username, data, update=false, del=false) {
  try {
    let func = () => {}
    if (update) {
      func = updateDoc
    } else if (del) {
      func = deleteDoc
    } else {
      func = setDoc
    }
    func(doc(db, "users", username, "groups", data.id), data)
  } catch (error) {
    console.error("writing document failed:", error)
  }
}

function editSubject(username, groupname, data, update=false, del=false) {
  try {
    let func = () => {}
    if (update) {
      func = updateDoc
    } else if (del) {
      func = deleteDoc
    } else {
      func = setDoc
    }
    console.log(db, "users", username, "groups", groupname, "subjects", data.id)
    func(
      doc(db, "users", username, "groups", groupname, "subjects", data.id), 
      data
    )
  } catch (error) {
    console.error("writing document failed:", error)
  }
}

function editModule(
  username, groupname, subjectname, data, 
  update=false, del=false
) {
  try {
    let func = () => {}
    if (update) {
      func = updateDoc
    } else if (del) {
      func = deleteDoc
    } else {
      func = setDoc
    }
    func(doc(
      db, 
      "users", username, "groups", groupname, 
      "subjects", subjectname, "modules", data.id
    ), data)
  } catch (error) {
    console.error("writing document failed:", error)
  }
}

function editSystem(username, data, update=false, del=false) {
  try {
    let func = () => {}
    if (update) {
      func = updateDoc
    } else if (del) {
      func = deleteDoc
    } else {
      func = setDoc
    }
    func(doc(db, "users", username, "systems", data.id), data)
  } catch (error) {
    console.error("writing document failed:", error)
  }
}

function getKey(object, value) {
  return Object.keys(object).find(key => object[key] === value)
}

async function findError(newObject, list, setError) {
  setError("")
  if (!newObject.color.match(/^#(?:(?:[\da-f]{3}){1,2}|(?:[\da-f]{4}){1,2})$/i)) {
    setError(`${newObject.color} is not a valid color.`)
  } else {
    for (let l in list) {
      if (list[l].name === newObject.name && list[l].id != newObject.id) {
        setError(`module with name "${newObject.name}" already exists.`)
      } 
    }
  }
  if (!newObject.name) {
    setError("a name is required.")
  }
}

function SubjectsBody(props) {
  const [color, setColor] = useState(
    Math.floor(Math.random()*16777215).toString(16)
  )
  const [error, setError] = useState(null)

  const [color2, setColor2] = useState(
    Math.floor(Math.random()*16777215).toString(16)
  )
  const [error2, setError2] = useState(null)

  useEffect(() => {
    setColor(Math.floor(Math.random()*16777215).toString(16))
    setColor2(Math.floor(Math.random()*16777215).toString(16))
    setError(null)
  }, [props.chosenGroup, props.chosenSubject, props.chosenModule]) 
  
  function newGroup(mode="add") {
    return {
      id: mode === "add" ? sha256(
        document.getElementById(`form-${mode}group-name-input`).value
      ) : props.chosenGroup.id,
      name: document.getElementById(`form-${mode}group-name-input`).value,
      description: document.getElementById(
        `form-${mode}group-description-input`
      ).value,
      color: document.getElementById(`form-${mode}group-color-input`).value,
      system: document.getElementsByClassName(
        `form-${mode}group-system-list-chosen`
      )[0].innerHTML
    }
  }

  function newSubject(mode="add") {
    return {
      id: mode === "add" ? sha256(
        document.getElementById(`form-${mode}subject-name-input`).value
      ) : props.chosenSubject.id,
      name: document.getElementById(`form-${mode}subject-name-input`).value,
      weightage: Number(document.getElementById(
        `form-${mode}subject-weightage-input`
      ).value),
      color: document.getElementById(`form-${mode}subject-color-input`).value,
    }
  }

  function newModule(mode="add", data) {
    return {
      id: mode === "add" ? sha256(
        document.getElementById(`form-${mode}module-name-input`).value
      ) : props.chosenModule.id,
      name: document.getElementById(`form-${mode}module-name-input`).value,
      weightage: Number(document.getElementById(
        `form-${mode}module-weightage-input`
      ).value),
      color: document.getElementById(`form-${mode}module-color-input`).value,
      tier: 0,
      weightage: 1,
      records: {
        [todaysDate()]: 0
      }
    }
  }

  if (props.chosenGroup.name === "settings") {
    return (
      <div className="subjects-body">
        <div className="add-group" onInput={
          () => findError(newGroup(), props.groupList, setError)
        }>
          add group:
          <div>
            name: <input 
              type="text"
              id="form-addgroup-name-input" 
              defaultValue="name" 
            />
          </div>
          <div>
            description: <input 
              type="text" 
              id="form-addgroup-description-input" 
              defaultValue="description" 
            />
          </div>
          <div style={{color: color}}>
            color: <input 
              type="text" 
              id="form-addgroup-color-input" 
              style={{color: color}} 
              onChange={e => setColor(e.target.value)} 
              pattern="[#0-9a-f]" 
              defaultValue={`#${color}`} 
            />
          </div>
          <div>
            system: <Select 
              id="form-addgroup-system-list" 
              classNames={
                {
                  singleValue: state => "form-addgroup-system-list-chosen"
                }
              }
              options={props.systems.map(i => {return {value: i.name, label: i.name}})} 
              defaultValue={
                {value: props.systems[0].name, label: props.systems[0].name}
              }
              placeholder="select a system." 
            />
          </div>
          <span style={{color: "#f00"}}>{error}</span>
          <button id="form-addgroup-submit-button" onClick={
            () => {
              findError(newGroup(), props.groupList, setError)
              if (!error && typeof error === "string") {
                editGroup(sha256(props.username), newGroup())
                fetchData(
                  [sha256(props.username), "groups"], 
                  props.setGroupList, props.setLoading, setError
                )
              }
            }
          }>add group</button>
        </div>
      </div>
    )
  } else if (props.chosenSubject.name === "settings") {
    return (
      <div className="subjects-body">
        <div 
          className="edit-group"
          onInput={() => findError(newGroup("edit"), props.groupList, setError)}
        >
          edit group:
          <div>
            name: <
              input type="text" 
              id="form-editgroup-name-input" 
              defaultValue={props.chosenGroup.name} 
            />
          </div>
          <div>
            description: <input 
              type="text" 
              id="form-editgroup-description-input" 
              defaultValue={props.chosenGroup.description} 
            />
          </div>
          <div style={{color: color}}>
            color: <input 
              type="text" 
              id="form-editgroup-color-input" 
              style={{color: color}} 
              defaultValue={props.chosenGroup.color} 
              onChange={e => setColor(e.target.value)} 
              pattern="[#0-9a-f]" 
            />
          </div>
          <div>
            system: <Select 
              id="form-editgroup-system-list" 
              classNames={
                {
                  singleValue: state => "form-editgroup-system-list-chosen"
                }
              }
              options={props.systems.map(i => {return {value: i.name, label: i.name}})} 
              defaultValue={props.chosenGroup.system} 
              placeholder="select a system." 
            />
          </div>
          <span style={{color: "#f00"}}>{error}</span>
          <button id="form-editgroup-submit-button" onClick={
            () => {
              findError(newGroup("edit"), props.groupList, setError)
              if (!error && typeof error === "string") {
                editGroup(sha256(props.username), newGroup("edit"), true)
                fetchData(
                  [sha256(props.username), "groups"], 
                  props.setGroupList, props.setLoading, setError
                )
              } 
            }
          }>edit group</button>
          <button id="form-editgroup-delete-button" onClick={
            () => {
              editGroup(
                sha256(props.username), 
                {id: props.chosenGroup.id}, 
                false, true
              )
              fetchData(
                [sha256(props.username), "groups"], 
                props.setGroupList, props.setLoading, setError
              )
              props.setChosenGroup(props.groupList[0])
            }
          }>delete group</button>
        </div>
        <div 
          className="add-subject" 
          onInput={
            () => findError(
              newSubject(), 
              props.subjectList, 
              setError2
            )
          }>
          add subject:
          <div>
            name: <input 
              type="text" 
              id="form-addsubject-name-input" 
              defaultValue="name" 
            />
          </div>
          <div>
            weightage: <input 
              type="number" 
              id="form-addsubject-weightage-input" 
              min="0" 
              pattern="[0-9.]" 
              defaultValue="0" 
            />
          </div>
          <div style={{color: color2}}>
            color: <input 
              type="text" 
              id="form-addsubject-color-input" 
              style={{color: color2}} 
              onChange={e => setColor2(e.target.value)} 
              pattern="[#0-9a-f]" 
              defaultValue={`#${color}`} 
            />
          </div>
          <button id="form-addsubject-submit-button" onClick={
            () => {
              findError(newSubject(), props.subjectList, setError)
              if (!error) {
                editSubject(
                  sha256(props.username), 
                  sha256(props.chosenGroup.name), 
                  newSubject()
                )
                fetchData(
                  [
                    sha256(props.username), "groups", 
                    sha256(props.chosenGroup.name), "subjects"
                  ], 
                  props.setSubjectList, props.setLoading, setError
                )
              }
            }
          }>add subject</button> 
        </div>
      </div>
    )
  } else if (props.chosenModule.name === "settings") {
    return (
      <div className="subjects-body">
        <div 
          className="edit-subject" 
          onInput={
            () => findError(newSubject("edit"), props.subjectList, setError)
          }>
          edit subject:
          <div>
            name: <input 
              type="text" 
              id="form-editsubject-name-input" 
              defaultValue={props.chosenSubject.name} 
            />
          </div>
          <div>
            weightage: <input 
              type="number" 
              id="form-editsubject-weightage-input" 
              min="0" 
              defaultValue={props.chosenSubject.weightage} 
              pattern="[0-9.]" 
            />
          </div>
          <div style={{color: color}}>
            color: <input 
              type="text" 
              id="form-editsubject-color-input" 
              onChange={e => setColor(e.target.value)} 
              defaultValue={props.chosenSubject.color} 
              pattern="[#0-9a-f]" 
            />
          </div>
          <button id="form-editsubject-submit-button" onClick={
            () => {
              findError(newSubject("edit"), props.subjectList, setError)
              if (!error) {
                editSubject(
                  sha256(props.username), 
                  sha256(props.chosenGroup.name), 
                  newSubject("edit"), 
                  true
                )
                fetchData(
                  [
                    sha256(props.username), "groups", 
                    sha256(props.chosenGroup.name), "subjects"
                  ], 
                  props.setSubjectList, props.setLoading, setError
                )
              }
            }
          }>edit subject</button>
          <button id="form-editsubject-delete-button" onClick={
            () => {
              editSubject(
                sha256(props.username), 
                sha256(props.chosenGroup.name), 
                {id: props.chosenSubject.id}, 
                false, true
              )
              fetchData(
                [
                  sha256(props.username), "groups", 
                  sha256(props.chosenGroup.name), "subjects"
                ], 
                props.setSubjectList, props.setLoading, setError
              )
              props.setChosenSubject(props.subjectList[0])
            }
          }>delete subject</button>
        </div>
        <div 
          className="add-module" 
          onInput={() => findError(newModule(), props.moduleList, setError2)}
        >
          add module:
          <div>
            name: <input 
              type="text" 
              id="form-addmodule-name-input" 
              defaultValue="name" 
            />
          </div>
          <div>
            weightage: <input 
              type="number" 
              id="form-addmodule-weightage-input" 
              min="0" 
              pattern="[0-9.]"
              defaultValue="0" 
            />
          </div>
          <div style={{color: color2}}>
            color: <input 
              type="text" 
              id="form-addmodule-color-input"
              onChange={e => setColor2(e.target.value)} 
              pattern="[#0-9a-f]" 
              defaultValue={`#${color}`} 
            />
          </div>
          <button id="form-addmodule-submit-button" onClick={
            () => {
              findError(newModule(), props.moduleList, setError)
              if (!error) {
                editModule(
                  sha256(props.username), 
                  sha256(props.chosenGroup.name), 
                  sha256(props.chosenSubject.name), 
                  newModule()
                )
                fetchData(
                  [
                    sha256(props.username), "groups", 
                    sha256(props.chosenGroup.name), "subjects", 
                    sha256(props.chosenSubject.name), "modules"
                  ], 
                  props.setModuleList, props.setLoading, setError
                )
              }
            }
          }>add module</button>
        </div>
      </div>
    )
  } else if (
    props.chosenGroup.name 
      && props.chosenSubject.name 
      && props.chosenModule.name
  ) {
    return (
      <div className="subjects-body">
        <div 
          className="edit-module" 
          onInput={
            () => findError(newModule("edit"), props.moduleList, setError)
          }
        >
          edit module:
          <div>
            name: <input 
              type="text" 
              id="form-editmodule-name-input" 
              defaultValue={props.chosenModule.name} 
            />
          </div>
          <div>
            weightage: <input 
              type="number" 
              id="form-editmodule-weightage-input" 
              min="0" 
              defaultValue={props.chosenModule.weightage} 
              pattern="[0-9.]" 
            />
          </div>
          <div style={{color: color}}>
            color: <input 
              type="text" 
              id="form-editmodule-color-input" 
              onChange={e => setColor(e.target.value)} 
              defaultValue={props.chosenModule.color} 
              pattern="[#0-9a-f]" 
            /> 
          </div>
          <button id="form-editmodule-submit-button" onClick={
            () => {
              findError(newModule("edit"), props.moduleList, setError)
              if (!error) {
                editModule(
                  sha256(props.username), 
                  sha256(props.chosenGroup.name), 
                  sha256(props.chosenSubject.name), 
                  newModule("edit"), 
                  true
                )
                fetchData(
                  [
                    sha256(props.username), "groups", 
                    sha256(props.chosenGroup.name), "subjects", 
                    sha256(props.chosenSubject.name), "modules"
                  ], 
                  props.setModuleList, props.setLoading, setError
                )
              }
            }
          }>edit module</button>
          <button id="form-editmodule-delete-button" onClick={
            () => {
              editModule(
                sha256(props.username), 
                sha256(props.chosenGroup.name), 
                sha256(props.chosenSubject.name), 
                {id: props.chosenModule.id}, 
                false, true
              )
              fetchData(
                [
                  sha256(props.username), "groups", 
                  sha256(props.chosenGroup.name), "subjects"
                ], 
                sha256(props.chosenSubject.name), "modules", 
                props.setModuleList, props.setLoading, setError
              )
              props.setChosenModule(props.moduleList[0])
            }
          }>delete module</button>
        </div>
      </div>
    )
  }
}

function Body(props) {
  const [users, setUsers] = useState(props.users)

  const [error, setError] = useState(null)

  const [loggedIn, setLoggedIn] = useState(
    checkLoggedIn(users, Cookies.get("loggedIn"))
  )
  const [signingUp, setSigningUp] = useState(false)

  const [chosenGroup, setChosenGroup] = useState({})  
  const [chosenSubject, setChosenSubject] = useState({})  
  const [chosenModule, setChosenModule] = useState({})

  const [groupList, setGroupList] = useState([])
  const [subjectList, setSubjectList] = useState([])
  const [moduleList, setModuleList] = useState([])

  const [systems, setSystems] = useState([])

  useEffect(() => {
    setLoggedIn(checkLoggedIn(users, Cookies.get("loggedIn")))

    fetchData([], setUsers, props.setLoading, setError)
    try {
      let username = JSON.parse(Cookies.get("loggedIn")).username
      if (checkLoggedIn(users, Cookies.get("loggedIn"))) {
        fetchData(
          [sha256(username), "groups"], 
          setGroupList, props.setLoading, setError
        )
        fetchData(
          [sha256(username), "systems"], 
          setSystems, props.setLoading, setError
        )
      }
    } catch (e) {console.error(e)}

  }, [props.tab, loggedIn, error])

  useEffect(() => {
    try {
      let username = JSON.parse(Cookies.get("loggedIn")).username
      if (checkLoggedIn(users, Cookies.get("loggedIn")) && props.tab === 1) {
        if (Object.keys(chosenGroup).length) {
          fetchData(
            [
              sha256(username), "groups", 
              sha256(chosenGroup.name), "subjects"
            ], 
            setSubjectList, props.setLoading, setError
          )
        }
        if (Object.keys(chosenSubject).length) {
          fetchData(
            [
              sha256(username), "groups", 
              sha256(chosenGroup.name), "subjects", 
              sha256(chosenSubject.name), "modules"
            ], 
            setModuleList, props.setLoading, setError
          )
        }
      }
    } catch (e) {console.error(e)}
  }, [props.tab, loggedIn, chosenGroup, chosenSubject])

  function logIn() {
    setError("")
    fetchData([], setUsers, props.setLoading, setError)

    const givenUsername = document.getElementById(
      'form-login-username-input'
    ).value
    const givenPassword = document.getElementById(
      'form-login-password-input'
    ).value
    
    let found = false
    users.forEach((user) => {
      if (user.account.username === givenUsername) {
        found = true
        if (user.account.password === sha256(givenUsername + givenPassword)) {
          Cookies.set(
            "loggedIn", 
            JSON.stringify({
              username: givenUsername, 
              password: sha256(givenUsername + givenPassword)
            }), 
            { expires: 365 })
          setLoggedIn(checkLoggedIn(users, Cookies.get("loggedIn")))
        } else {
          setError("wrong password.")
        }
      }
    })
    if (!found) {
      setError("invalid username.")
    }
    if (givenUsername === null) {
      setError("Fields cannot be empty.")
    }
    if (givenPassword === null) {
      setError("Fields cannot be empty.")
    }
  }

  function logOut() {
    Cookies.set("loggedIn", "", { expires: 365 })
    setLoggedIn(checkLoggedIn(users, Cookies.get("loggedIn")))
  }

  function signUp() {
    setError("")
    fetchData([], setUsers, props.setLoading, setError)

    const givenUsername = document.getElementById(
      'form-login-username-input'
    ).value
    const givenPassword = document.getElementById(
      'form-login-password-input'
    ).value
    const confirmPassword = document.getElementById(
      'form-login-password-input-confirm'
    ).value
    let found = false
    users.forEach((user) => {
      if (user.account.username === givenUsername) {
        found = true
      }
    })
    if (found) {
      setError("username already taken.")
      return
    }
    if (givenPassword !== confirmPassword) {
      setError("passwords do not match.")
    } else {
      let exception = false
      try {
        setDoc(doc(db, "users", sha256(givenUsername)), {
          account: {
            id: sha256(givenUsername),
            username: givenUsername,
            password: sha256(givenUsername + givenPassword),
            profile_image: "https://i.pinimg.com/custom_covers/222x/85498161615209203_1636332751.jpg", 
          },
          tiers: [
            {
              name: "no",
              value: 0,
              color: "#f00"
            },
            {
              name: "yes",
              value: 1,
              color: "#0f0"
            }
          ]
        })
        editGroup(sha256(givenUsername), {
          id: sha256("sample group"),
          name: "sample group",
          description: "sample description",
          color: "#ffffff",
          system: "MSG"
        })
        editSubject(sha256(givenUsername), sha256("sample group"), {
          id: sha256("sample subject"),
          name: "sample subject",
          weightage: 1,
          color: "#ffffff"
        })
        editModule(
          sha256(givenUsername), 
          sha256("sample group"), 
          sha256("sample subject"), 
          {
            id: sha256("sample module"),
            name: "sample module",
            tier: 0,
            weightage: 1,
            color: "#ffffff",
            records: {
              [todaysDate()]: 0
            }
          }
        )
        editSystem(sha256(givenUsername), {
          id: sha256("MSG"),
          name: "MSG", 
          bands: {
            A1: {
              condition: "(i) => {return i >= 75}", 
              color: "#ff0000",
            },
            A2: {
              condition: "(i) => {return i >= 70 && i < 75}", 
              color: "#ffaa00"
            },
            B3: {
              condition: "(i) => {return i >= 65 && i < 70}", 
              color: "#aaff00"
            },
            B4: {
              condition: "(i) => {return i >= 60 && i < 65}", 
              color: "#00ff00"
            }, 
            C5: {
              condition: "(i) => {return i >= 55 && i < 60}", 
              color: "#00ffaa"
            }, 
            C6: {
              condition: "(i) => {return i >= 50 && i < 55}", 
              color: "#00aaff"
            }, 
            D7: {
              condition: "(i) => {return i >= 45 && i < 50}", 
              color: "#0000ff"
            }, 
            E8: {
              condition: "(i) => {return i >= 40 && i < 45}", 
              color: "#aa00ff"
            }, 
            F9: {
              condition: "(i) => {return i < 40}", 
              color: "#ff00aa"
            }
          }
        })
        editSystem(sha256(givenUsername), {
          id: sha256("GPA 1"),
          name: "GPA 1", 
          bands: {
            "A+": {
              condition: "(i) => {return i >= 80}", 
              color: "#a65bf5"
            },
            A: {
              condition: "(i) => {return i >= 70 && i < 80}", 
              color: "#a53ef4"
            },
            "B+": {
              condition: "(i) => {return i >= 65 && i < 70}", 
              color: "#a921f2"
            },
            B: {
              condition: "(i) => {return i >= 60 && i < 65}", 
              color: "#ad0de7"
            },
            "C+": {
              condition: "(i) => {return i >= 55 && i < 60}", 
              color: "#a65bf5"
            },
            C: {
              condition: "(i) => {return i >= 50 && i < 55}", 
              color: "#a70cca"
            },
            D: {
              condition: "(i) => {return i >= 45 && i < 50}", 
              color: "#9d0aae"
            },
            E: {
              condition: "(i) => {return i >= 40 && i < 45}", 
              color: "#8e0891"
            },
            F: {
              condition: "(i) => {return i < 40}", 
              color: "#74076c"
            }
          }
        })
        editSystem(sha256(givenUsername), {
          id: sha256("GPA 2"),
          name: "GPA 2", 
          bands: {
            "A+": {
              condition: "(i) => {return i >= 85}", 
              color: "#2bf3d1"
            },
            A: {
              condition: "(i) => {return i >= 70 && i < 85}", 
              color: "#19e6d8"
            },
            "B+": {
              condition: "(i) => {return i >= 65 && i < 70}", 
              color: "#21bbc0"
            },
            B: {
              condition: "(i) => {return i >= 60 && i < 65}", 
              color: "#258d9d"
            },
            "C+": {
              condition: "(i) => {return i >= 55 && i < 60}", 
              color: "#26697d"
            },
            C: {
              condition: "(i) => {return i >= 50 && i < 55}", 
              color: "#254c5f"
            },
            "C-": {
              condition: "(i) => {return i >= 45 && i < 50}", 
              color: "#213545"
            },
            "D+": {
              condition: "(i) => {return i >= 40 && i < 45}", 
              color: "#1a232d"
            },
            D: {
              condition: "(i) => {return i >= 35 && i < 40}", 
              color: "#1a212d"
            },
            E: {
              condition: "(i) => {return i >= 20 && i < 35}", 
              color: "#1a1f2d"
            },
            U: {
              condition: "(i) => {return i < 20}", 
              color: "#1a1e2d"
            }
          }
        }) 
      } catch (error) {
        console.error("writing document failed:", error)
        exception = error
      } 
      if (!exception) {
        Cookies.set(
          "loggedIn", 
          JSON.stringify({
            username: givenUsername, 
            password: sha256(givenUsername + givenPassword)
          }), 
          { expires: 365 }
        )
        fetchData([], setUsers, props.setLoading, setError)
        setLoggedIn(checkLoggedIn(users, Cookies.get("loggedIn")))
      } else {
        deleteDoc(doc(db, "users", givenUsername))
      }
    }
    if (givenUsername === null) {
      setError("Fields cannot be empty.")
    }
    if (givenPassword === null) {
      setError("Fields cannot be empty.")
    }
  }
 
  if (props.error) {
    return (<div className='body'>{String(props.error)}</div>)
  } else if (props.loading) {
    return (
      <div className="body"> 
        loading...
      </div>
    )
  } else if (!loggedIn && props.tab !== 3) {
    return (
      <div className="body">
        um... i think you should probably log in or sign up first
      </div>
    )
  } else {
    switch (props.tab) {
      case 0:
        return (
          <div className="body">
            welcome home! :3
          </div>
        )
      case 1:
        if (props.loading) {
          return (
            <div className="body"> 
              loading...
            </div>
          )
        }
        return (
          <div className="body">
            <div className="side-panel groups">
              {
                groupList.map((group) => {
                  return <button 
                    className={
                      `side-panel-item 
                      ${chosenGroup.id === group.id ? "selected" : ""}`
                    } 
                    style={{color: group.color}} 
                    onClick={
                      () => {
                        setChosenGroup(group)
                        setChosenSubject({name: "settings"})
                        setChosenModule({})
                      }
                    }
                  >{group.name}</button>
                })
              }
              <button 
                className={
                  `side-panel-item 
                  ${chosenGroup.name === "settings" ? "selected" : ""}`
                } 
                onClick={
                  () => {
                    setChosenGroup({name: "settings"})
                    setChosenSubject({})
                    setChosenModule({})
                  }
                }
              >overall settings</button>
            </div>
            {
              chosenGroup.name === "settings" ? <div></div> : 
                !Object.keys(chosenGroup).length ? "select a group first." : 
                  !subjectList ? "add a subject!" : <div 
                    className="side-panel subjects"
                  >
                { 
                  subjectList.map((subject) => {
                    return <button 
                      className={
                        `side-panel-item 
                        ${chosenSubject.id === subject.id ? "selected" : ""}`
                      } 
                      style={{color: subject.color}} 
                      onClick={
                        () => {
                          setChosenSubject(subject)
                          setChosenModule({name: "settings"})
                        }
                      }
                    >{subject.name}</button>
                  })
                }
                <button 
                  className={
                    `side-panel-item 
                    ${chosenSubject.name === "settings" ? "selected" : ""}`
                  } 
                  onClick={
                    () => {
                      setChosenSubject({name: "settings"}); setChosenModule({})
                    }
                  }
                >group settings</button>
              </div>
            }
            {
              chosenGroup.name === "settings" 
                || chosenSubject.name === "settings" 
                ? <div></div> : 
                !Object.keys(chosenSubject).length ? (
                  Object.keys(chosenGroup).length ? "select a subject first." : ""
                ) : 
                  !moduleList ? "add a module!" :
                  <div className="side-panel modules">
                {
                  moduleList.map((module) => { 
                    return <button 
                      className={
                        `side-panel-item 
                        ${chosenModule.id === module.id ? "selected" : ""}`
                      } 
                      style={{color: module.color}} 
                      onClick={() => {setChosenModule(module)}}
                    >{module.name}</button>
                  })
                }
                <button 
                  className={
                    `side-panel-item 
                    ${chosenModule.name === "settings" ? "selected" : ""}`
                  } 
                  onClick={() => {setChosenModule({name: "settings"})}}
                >subject settings</button>
              </div>
            }
            <SubjectsBody 
              username={checkUsername(users, Cookies.get("loggedIn"))} 
              groupList={groupList} setGroupList={setGroupList} 
              subjectList={subjectList} setSubjectList={setSubjectList} 
              moduleList={moduleList} setModuleList={setModuleList} 
              chosenGroup={chosenGroup} setChosenGroup={setChosenGroup} 
              chosenSubject={chosenSubject} setChosenSubject={setChosenSubject} 
              chosenModule={chosenModule} setChosenModule={setChosenModule} 
              systems={systems} 
              setLoading={props.setLoading} 
            />
          </div>
        )
      case 2:
        if (!loggedIn) {
          return (
            <div className="body">
              log in first!
            </div>
          )
        } else {
          return (
            <div className="body">
              here are all your stats!
              <div>
                <Select
                  className="form-stats-timegraph-group-list"
                  classNames={{
                    singleValue: (state) => "form-addlog-group-list-chosen",
                    control: (state) => "dropbtn",
                    container: (state) => "dropdown",
                    menuList: (state) => "dropdown-content",
                  }}
                  options={groupList.map((i) => ({ value: i, label: i.name }))}
                  placeholder="select a group."
                  onChange={(e) => {
                    setChosenGroup(e.value);
                  }}
                />
              </div>
            </div>
          )
        }
      case 3:
        if (!loggedIn) {
          if (!props.loading) {
            if (!signingUp) {
              return (
                <div className="body">
                  <div>
                    username: <input 
                      type="text" 
                      id="form-login-username-input" 
                    />
                  </div>
                  <div>
                    password: <input 
                      type="password" 
                      id="form-login-password-input" 
                    />
                  </div>
                  <button 
                    className="button" 
                    id="form-login-submit-button" 
                    onClick={logIn}
                  >log in</button>
                  <div style={{color: "red"}}>{error}</div>
                  <div>
                    if you don't have an account yet, sign up 
                    <a onClick={() => setSigningUp(true)}>here</a>.
                  </div>
                </div>
              )
            } else {
              return (
                <div className="body">
                  <div>
                    username: <input 
                      type="text" 
                      id="form-login-username-input" 
                    />
                  </div>
                  <div>
                    password: <input 
                      type="password" 
                      id="form-login-password-input" 
                    />
                  </div>
                  <div>
                    confirm password: <input 
                      type="password" 
                      id="form-login-password-input-confirm" 
                    />
                  </div>
                  <button 
                    className="button" 
                    id="form-login-submit-button" 
                    onClick={signUp}
                  >sign up</button>
                  <div style={{color: "red"}}>{error}</div>
                  <div>
                    if you already have an account, log in 
                    <a onClick={() => setSigningUp(false)}>here</a>.
                  </div>
                </div>
              )
            }
          } else {
            return ("hold on its loading")
          }
        } else {
          return (
            <div className="body">
              <button onClick={() => logOut()}>log out</button>
            </div>
          )  
        }
      default:
        return checkLoggedIn(
          users, Cookies.get("loggedIn")
        ) ? "youre logged in yay!" : "uhh yeah um"
    }
  }
}

function AddLog(props) {
  const [error, setError] = useState("")
  const [loggedIn, setLoggedIn] = useState(checkLoggedIn(props.users, Cookies.get("loggedIn")))

  const [tiers, setTiers] = useState([])

  const [username, setUsername] = useState("")

  const [chosenGroup, setChosenGroup] = useState({})  
  const [chosenSubject, setChosenSubject] = useState({})  
  const [chosenModule, setChosenModule] = useState({})
  const [chosenTier, setChosenTier] = useState({})

  const [groupList, setGroupList] = useState([])
  const [subjectList, setSubjectList] = useState([])
  const [moduleList, setModuleList] = useState([])

  const [subjectTotals, setSubjectTotals] = useState([0, 0])
  const [groupTotals, setGroupTotals] = useState([0, 0])

  useEffect(() => {
    setLoggedIn(checkLoggedIn(props.users, Cookies.get("loggedIn")))

    fetchData([], props.setUsers, props.setLoading, setError)
    try {
      let username = JSON.parse(Cookies.get("loggedIn")).username
      if (checkLoggedIn(props.users, Cookies.get("loggedIn"))) {
        fetchData(
          [sha256(username), "groups"], 
          setGroupList, props.setLoading, setError
        )
      }
    } catch (e) {console.error(e)}
    const currentUser = getCurrentUser(props.users, Cookies.get("loggedIn"))
    if (Object.keys(currentUser).length) {
      setTiers(currentUser.tiers)
      setUsername(currentUser.account.username)
    }
  }, [props.tab, loggedIn, error])

  useEffect(() => {
    try {
      let username = JSON.parse(Cookies.get("loggedIn")).username
      if (checkLoggedIn(props.users, Cookies.get("loggedIn"))) {
        if (chosenGroup.name) {
          fetchData(
            [
              sha256(username), "groups", 
              sha256(chosenGroup.name), "subjects"
            ], 
            setSubjectList, props.setLoading, setError
          )
        }
        if (chosenSubject.name) {
          fetchData(
            [
              sha256(username), "groups", 
              sha256(chosenGroup.name), "subjects", 
              sha256(chosenSubject.name), "modules"
            ], 
            setModuleList, props.setLoading, setError
          )
        }
      }
    } catch (e) {console.error(e)}
  }, [props.tab, loggedIn, chosenGroup, chosenSubject])

  useEffect(() => {
    const fetchDataAsync = async () => {
      const total1 = await subjectTotal(
        username, 
        chosenGroup, 
        chosenSubject
      )
      const total2 = await subjectTotal(
        username, 
        chosenGroup, 
        chosenSubject, 
        chosenModule, 
        typeof chosenTier.value === "number" ? chosenTier.value : 0
      )
      setSubjectTotals([total1, total2])

      const total3 = await groupTotal(
        username, 
        chosenGroup 
      )
      const total4 = await groupTotal(
        username, 
        chosenGroup, 
        chosenSubject,
        chosenModule, 
        typeof chosenTier.value === "number" ? chosenTier.value : 0
      )
      setGroupTotals([total3, total4])
    }
    fetchDataAsync()
  }, [username, chosenGroup, chosenSubject, chosenModule, chosenTier.value])
 
  
  return (
    <div className="add-log">
      add log:
      <Select
        className="form-addlog-group-list"
        classNames={
          {
            singleValue: state => "form-addlog-group-list-chosen",
            control: state => "dropbtn",
            container: state => "dropdown",
            menu: state => "dropdown-menu",
            menuList: state => "dropdown-content",
            option: state => "dropdown-option",
            menuPortal: state => "dropdown-menuportal"
          }
        }
        options={
          [{value: "test", label: "testing label"}]
        }
        placeholder="select a group." 
        onChange={e => {
          setChosenGroup(e.value);
        }}
      />
      {loggedIn ? (
        chosenGroup ? (
          <Select
            className="form-addlog-subject-list"
            classNames={{
              singleValue: (state) => "form-addlog-subject-list-chosen",
            }}
            options={subjectList.map((i) => ({ value: i, label: i.name }))}
            placeholder="select a subject."
            onChange={(e) => {
              setChosenSubject(e.value);
            }}
          />
        ) : (
          <Select
            isDisabled={true}
            className="form-addlog-subject-list"
            classNames={{
              singleValue: (state) => "form-addlog-subject-list-chosen",
            }}
            placeholder="select a group first."
          />
        )
      ) : null}
      {chosenSubject ? (
        <Select
          className="form-addlog-module-list"
          classNames={{
            singleValue: (state) => "form-addlog-module-list-chosen",
          }}
          options={moduleList.map((i) => ({ value: i, label: i.name }))}
          placeholder="select a module."
          onChange={(e) => {
            setChosenModule(e.value);
          }}
        />
      ) : (
        <Select
          isDisabled={true}
          className="form-addlog-module-list"
          classNames={{
            singleValue: (state) => "form-addlog-module-list-chosen",
          }}
          placeholder={
            chosenGroup
              ? "select a subject first."
              : "select a group first."
          }
        />
      )}
      {chosenModule ? (
        <div>
          <div>
            <Select
              className="form-addlog-progress-list"
              classNames={{
                singleValue: (state) => "form-addlog-progress-list-chosen",
              }}
              options={tiers.map((tier) => ({
                value: tier,
                label: tier.name,
              }))}
              onChange={(e) => {
                setChosenTier(e.value);
              }}
              placeholder="select a tier."
            />
          </div>
          <div>
            description:{" "}
            <input type="text" id="form-addlog-progress-input" />
          </div>
          <button
            onClick={() => {
              editModule(
                sha256(username),
                sha256(chosenGroup.name),
                sha256(chosenSubject.name),
                {
                  id: chosenModule.id,
                  tier: chosenTier.value,
                  [`records.${todaysDate()}`]: chosenTier.value,
                },
                true
              );
              fetchData(
                [
                  sha256(username),
                  "groups",
                  sha256(chosenGroup.name),
                  "subjects",
                  sha256(chosenSubject.name),
                  "modules",
                ],
                props.setModuleList,
                props.setLoading,
                setError
              );
            }}
          >
            add log
          </button>
          <div>
            <p>
              module score:{" "}
              {typeof chosenModule.tier === "number"
                ? Math.round(
                    (chosenModule.tier / (tiers.length - 1)) * 10000
                  ) / 100
                : "?"}{" "}
              →{" "}
              {typeof chosenTier.value === "number"
                ? Math.round((chosenTier.value / (tiers.length - 1)) * 10000) /
                  100
                : "?"}
            </p>
            <p>
              subject score:{" "}
              {typeof subjectTotals[0] === "number"
                ? Math.round(subjectTotals[0] * 100) / 100
                : "?"}{" "}
              →{" "}
              {typeof subjectTotals[1] === "number"
                ? Math.round(subjectTotals[1] * 100) / 100
                : "?"}
            </p>
            <p>
              group score:{" "}
              {typeof groupTotals[0] === "number"
                ? Math.round(groupTotals[0] * 100) / 100
                : "?"}{" "}
              →{" "}
              {typeof groupTotals[1] === "number"
                ? Math.round(groupTotals[1] * 100) / 100
                : "?"}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function App() {
  const [tab, setTab] = useState(0)

  const [users, setUsers] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData([], setUsers, setLoading, setError)
  }, [tab]); 

  const navbar = (
    <div className="navbar">
      <div className="header left">
        <button 
          className="header-children" 
          onClick={() => setTab(0)}
        >home</button>
        <button 
          className="header-children" 
          onClick={() => setTab(1)}
        >subjects</button> 
        <button 
          className="header-children" 
          onClick={() => setTab(2)}
        >stats</button> 
      </div>
      <div className="header right">
        <button 
          className="header-children" 
          onClick={() => setTab(3)}
        >
          {
            checkLoggedIn(
              users, Cookies.get("loggedIn")
            ) ? "account" : "log in / sign up"
          }
        </button>
      </div>
    </div>
  )

  return (
    <div className="App">
      <script src="https://www.gstatic.com/firebasejs/10.6.0/firebase-app-compat.js"></script>
      <script src="https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore-compat.js"></script>
      {navbar}
      <Body 
        tab={tab} 
        users={users} setUsers={setUsers} 
        loading={loading} setLoading={setLoading} 
        error={error} 
      />
      <AddLog 
        tab={tab}
        users={users} setUsers={setUsers}
        setLoading={setLoading} 
      />
    </div>
  )
}

export default App
