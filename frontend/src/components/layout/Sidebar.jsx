import { NavLink } from "react-router-dom";

function Sidebar() {
    const links = [
        {
            name: "Dashboard",
            path: "/dashboard",
        },
        {
            name: "Marketplace",
            path: "/marketplace",
        },
        {
            name: "Analytics",
            path: "/analytics",
        },
        {
            name: "Explore",
            path: "/explore",
        },
    ];

    return (
        <aside className="w-64 mt-20 bg-slate-900 border-r border-slate-700 h-screen fixed">
            <div className="p-6 space-y-3">
                {
                    links.map((link) => (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            className={({ isActive }) =>
                                `block rounded-lg px-4 py-3 transition ${
                                    isActive
                                        ? "bg-cyan-500 text-white"
                                        : "text-gray-300 hover:bg-slate-800"
                                }`
                            }
                        >
                            {link.name}
                        </NavLink>
                    ))
                }
            </div>
        </aside>
    );

}

export default Sidebar;