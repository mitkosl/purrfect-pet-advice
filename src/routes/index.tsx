import { createFileRoute } from "@tanstack/react-router";
import {
  Stethoscope,
  Syringe,
  Scissors,
  HeartPulse,
  MapPin,
  Phone,
  MessageCircle,
} from "lucide-react";
import { useState } from "react";

import hero from "@/assets/hero.jpg";
import kitten from "@/assets/kitten.jpg";
import smallPets from "@/assets/small-pets.jpg";
import logo from "@/assets/pal-logo.png";
import { PetChat } from "@/components/PetChat";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isChatDebugEnabled } from "@/lib/chat-presentation";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({
    debug: isChatDebugEnabled(search["debug"]),
  }),
  head: () => ({
    meta: [
      { title: "Pawsome Vet Clinic — Care for every paw" },
      {
        name: "description",
        content:
          "Friendly veterinary clinic for cats, dogs and small pets, with an AI assistant for care advice.",
      },
      { property: "og:title", content: "Pawsome Vet Clinic" },
      {
        property: "og:description",
        content: "Friendly vet care plus an AI assistant that recommends pet products.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const services = [
  { icon: Stethoscope, title: "Check-ups", text: "Gentle wellness exams for every age." },
  { icon: Syringe, title: "Vaccines", text: "Kitten & puppy vaccination plans." },
  { icon: Scissors, title: "Grooming", text: "Baths, trims and nail care." },
  { icon: HeartPulse, title: "Surgery", text: "Modern, safe and caring." },
];

function Index() {
  const { debug } = Route.useSearch();
  const [chatOpen, setChatOpen] = useState(false);
  const [hasProducts, setHasProducts] = useState(false);

  return (
    <div className="min-h-screen">
      <main>
        <header className="flex items-center justify-between px-6 py-5 md:px-12">
          <div className="flex items-center gap-2">
            <img src={logo} alt="" width={36} height={36} className="size-9" />
            <span className="font-display text-xl">Pawsome Vet</span>
          </div>
          <nav className="hidden gap-8 text-sm text-muted-foreground md:flex">
            <a href="#services">Services</a>
            <a href="#team">Pets we love</a>
            <a href="#visit">Visit</a>
          </nav>
        </header>

        <section className="px-6 pb-16 md:px-12">
          <div className="relative overflow-hidden rounded-3xl">
            <img
              src={hero}
              alt="Puppy and kitten at the clinic"
              width={1536}
              height={1024}
              className="h-[480px] w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/20 to-transparent" />
            <div className="absolute bottom-0 left-0 max-w-lg p-8 md:p-12">
              <p className="mb-3 text-sm uppercase tracking-widest text-background/80">
                Veterinary clinic
              </p>
              <h1 className="font-display text-5xl leading-[1.05] text-background md:text-6xl">
                Care for every paw, whisker & wing.
              </h1>
              <a
                href="#visit"
                className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
              >
                Book a visit
              </a>
            </div>
          </div>
        </section>

        <section id="services" className="px-6 pb-20 md:px-12">
          <h2 className="font-display text-4xl">What we do</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {services.map((s) => (
              <div key={s.title} className="rounded-2xl bg-secondary p-6">
                <s.icon className="size-6 text-primary" />
                <p className="mt-4 font-medium">{s.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="team" className="grid gap-6 px-6 pb-20 md:grid-cols-2 md:px-12">
          <figure className="overflow-hidden rounded-3xl bg-secondary">
            <img
              src={kitten}
              alt="Kitten held by a vet"
              loading="lazy"
              width={1024}
              height={1024}
              className="aspect-square w-full object-cover"
            />
            <figcaption className="p-6">
              <p className="font-display text-2xl">New kitten?</p>
              <p className="text-sm text-muted-foreground">
                Ask Pal in the chat for a first-weeks care plan.
              </p>
            </figcaption>
          </figure>
          <figure className="overflow-hidden rounded-3xl bg-secondary">
            <img
              src={smallPets}
              alt="Rabbit and parrot"
              loading="lazy"
              width={1024}
              height={1024}
              className="aspect-square w-full object-cover"
            />
            <figcaption className="p-6">
              <p className="font-display text-2xl">Small & exotic pets</p>
              <p className="text-sm text-muted-foreground">
                Rabbits, birds, and more — all welcome.
              </p>
            </figcaption>
          </figure>
        </section>

        <footer id="visit" className="border-t px-6 py-10 text-sm text-muted-foreground md:px-12">
          <div className="flex flex-wrap gap-8">
            <span className="flex items-center gap-2">
              <MapPin className="size-4" /> 12 Example Street, Sofia
            </span>
            <span className="flex items-center gap-2">
              <Phone className="size-4" /> +359 000 000 000
            </span>
            <span>Mon–Sat, 9:00–19:00</span>
          </div>
        </footer>
      </main>

      {chatOpen && (
        <div
          role="dialog"
          aria-label="Chat with Pal"
          className={cn(
            "fixed bottom-4 right-4 z-50 flex h-[min(680px,calc(100dvh-2rem))] flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl md:bottom-6 md:right-6 motion-safe:transition-[width] motion-safe:duration-300",
            hasProducts ? "w-[min(580px,calc(100vw-2rem))]" : "w-[min(400px,calc(100vw-2rem))]",
          )}
        >
          <PetChat
            debug={debug}
            onClose={() => {
              setChatOpen(false);
              setHasProducts(false);
            }}
            onProductsChange={setHasProducts}
          />
        </div>
      )}

      {!chatOpen && (
        <Button
          onClick={() => setChatOpen(true)}
          aria-label="Chat with Pal"
          className="fixed bottom-6 right-4 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 md:right-6"
        >
          <MessageCircle className="size-6" />
        </Button>
      )}
    </div>
  );
}
