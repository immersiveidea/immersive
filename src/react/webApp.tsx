import "./styles.css";
import '@mantine/core/styles.css';
import React from "react";
import {RouterProvider} from "react-router-dom";
import {webRouter} from "./webRouter";

export default function WebApp() {
    document.addEventListener('promptpassword', () => {
        const password = document.querySelector('#password');
        if (password) {
            (password as HTMLInputElement).style.display = 'block';
        }
    });

    return (
            <RouterProvider router={webRouter}/>
    )
}
