import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import AuthProvider from "./context/AuthProvider";
import MapInterface from "./pages/MapDataAdding";
import Homepage from "./pages/Homepage";

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Routes>
          <Route path="/" element={<Homepage/>}/>
          <Route path="/signup" element={<Signup/>}/>
          <Route path="/login" element={<Login/>}/>
          <Route path="/dashboard" element={<Dashboard/>}/>
          <Route path="/addmapdata" element={<MapInterface />}/>
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;




// import React from 'react'
// import Loginda from './Loginda'
// import FileUploader from './pages/FileUploader'

// // import PayButton from './PayButton'

// const App = () => {
//   return (
//     <div>
//       <Loginda/>
//       <FileUploader/>
//     </div>
//   )
// }

// export default App


