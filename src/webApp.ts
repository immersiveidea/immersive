import {createRoot} from "react-dom/client";
import WebApp from "./react/webApp";

const root = createRoot(document.getElementById('webApp'));
root.render(WebApp());