import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function DashboardMetrics(){

  const [stats,setStats] = useState({
    active:0,
    handled:0,
    intersections:0,
    overrides:0
  });

  async function loadStats(){

    const today = new Date().toISOString();

    const { count: active } = await supabase
      .from("emergencies")
      .select("*",{count:"exact", head:true})
      .eq("status","active");

    const { count: handled } = await supabase
      .from("emergencies")
      .select("*",{count:"exact", head:true})
      .not("completed_at","is",null);

    const { count: intersections } = await supabase
      .from("signal_events")
      .select("*",{count:"exact", head:true});

    const { count: overrides } = await supabase
      .from("overrides")
      .select("*",{count:"exact", head:true});

    setStats({
      active: active || 0,
      handled: handled || 0,
      intersections: intersections || 0,
      overrides: overrides || 0
    });

  }

  useEffect(()=>{

    loadStats();

    const channel = supabase
      .channel("live-dashboard")

      .on(
        "postgres_changes",
        {event:"*", schema:"public", table:"emergencies"},
        loadStats
      )

      .on(
        "postgres_changes",
        {event:"*", schema:"public", table:"signal_events"},
        loadStats
      )

      .on(
        "postgres_changes",
        {event:"*", schema:"public", table:"overrides"},
        loadStats
      )

      .subscribe();

    return ()=> supabase.removeChannel(channel);

  },[]);


  return(
    <>
      <div>{stats.active}</div>
      <div>{stats.handled}</div>
      <div>{stats.intersections}</div>
      <div>{stats.overrides}</div>
    </>
  );

}
