"use client";

import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { playSoft, setSoundOn, soundOn } from "@/lib/sound";

export function SoundToggle() {
  const [on, setOn] = useState(true);

  useEffect(() => {
    setOn(soundOn());
  }, []);

  return (
    <Button
      onClick={() => {
        const next = !on;
        setSoundOn(next);
        setOn(next);
        if (next) playSoft();
      }}
      type="button"
      variant={on ? "secondary" : "outline"}
    >
      {on ? <Volume2 data-icon="inline-start" /> : <VolumeX data-icon="inline-start" />}
      {on ? "Knappljud på" : "Knappljud av"}
    </Button>
  );
}
