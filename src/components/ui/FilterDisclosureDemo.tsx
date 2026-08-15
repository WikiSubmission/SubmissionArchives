"use client";

import { useState } from "react";
import { FilterDisclosure, type FilterItem } from "./filter-disclosure";
import { FaBell, FaTasks } from "react-icons/fa";
import { IoCalendar } from "react-icons/io5";
import { BsFillPeopleFill, BsPinFill } from "react-icons/bs";
import { RiBubbleChartFill } from "react-icons/ri";

export function FilterDisclosureDemo() {
    const [activeFilter, setActiveFilter] = useState("reminders");

    const items: FilterItem[] = [
        { id: "tasks", label: "Tasks", icon: FaTasks },
        { id: "events", label: "Events", icon: IoCalendar },
        { id: "reminders", label: "Reminders", icon: FaBell },
        { id: "appointments", label: "Appointment", icon: BsPinFill },
        { id: "meetings", label: "Meetings", icon: BsFillPeopleFill },
        { id: "celebrations", label: "Celebrations", icon: RiBubbleChartFill },
    ];

    return (
        <div className="flex flex-col items-center justify-center gap-4 py-6">
            <FilterDisclosure
                items={items}
                defaultActiveId="reminders"
                onChange={(id) => setActiveFilter(id)}
            />
            <p className="font-mono text-xs text-ed-fg-muted">
                Active Filter: <span className="font-bold text-ed-fg capitalize">{activeFilter}</span>
            </p>
        </div>
    );
}

export default FilterDisclosureDemo;
