"use client";

import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { play, setSoundOn, soundOn } from "@/lib/sound";

export function SoundToggle() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(soundOn());
  }, []);

  return (
    <Button
      onClick={() => {
        const next = !on;
        setSoundOn(next);
        setOn(next);
        if (next) play("save");
      }}
      type="button"
      variant={on ? "secondary" : "outline"}
    >
      {on ? <Volume2 data-icon="inline-start" /> : <VolumeX data-icon="inline-start" />}
      {on ? "Ljud i programmet på" : "Ljud i programmet av"}
    </Button>
  );
}
