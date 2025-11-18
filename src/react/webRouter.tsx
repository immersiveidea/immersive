import React from "react";
import {createBrowserRouter} from "react-router-dom";
import About from "./marketing/about";
import Documentation from "./marketing/documentation";
import Examples from "./marketing/examples";
import Pricing from "./marketing/pricing";
import VrExperience from "./pages/vrExperience";
import NotFound from "./pages/notFound";
import {ProtectedRoute} from "./components/ProtectedRoute";

export const webRouter = createBrowserRouter([
    {
        path: "/",
        element: (
            <About/>
        ),
    },
    {
        path: "/documentation",
        element: (
            <ProtectedRoute page="documentation">
                <Documentation/>
            </ProtectedRoute>
        )
    }, {
        path: "/examples",
        element: (
            <ProtectedRoute page="examples">
                <Examples/>
            </ProtectedRoute>
        )
    }, {
        path: "/Pricing",
        element: (
            <ProtectedRoute page="pricing">
                <Pricing/>
            </ProtectedRoute>
        )
    }, {
        path: "/db/public/:db",
        element: (
            <ProtectedRoute page="vrExperience">
                <VrExperience/>
            </ProtectedRoute>
        )
    }, {
        path: "/db/private/:db",
        element: (
            <ProtectedRoute page="vrExperience">
                <VrExperience/>
            </ProtectedRoute>
        )
    }, {
        path: "*",
        element: (<NotFound/>)
    }

])