"use client"

import { useState } from "react"
import { useGameContext } from "./game-context-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Sword, Shield, Clock, Zap, Trophy, Users, Map, Sparkles, Coins } from "lucide-react"
import { GameCard } from "./game-card"
import { QuestCard } from "./quest-card"

export function GameDashboard() {
  const { increaseXP, increaseCoins } = useGameContext()
  const [selectedTab, setSelectedTab] = useState("battles")

  const handleBattle = () => {
    // Simulate winning a battle
    increaseXP(25)
    increaseCoins(50)
  }

  return (
    <div className="flex-1 container mx-auto px-4 py-6">
      <Tabs defaultValue="battles" className="w-full" onValueChange={setSelectedTab}>
        <div className="flex justify-between items-center mb-6">
          <TabsList className="grid grid-cols-4 w-full max-w-md">
            <TabsTrigger value="battles" className="data-[state=active]:bg-purple-700">
              <Sword className="h-4 w-4 mr-2" />
              Battles
            </TabsTrigger>
            <TabsTrigger value="quests" className="data-[state=active]:bg-purple-700">
              <Map className="h-4 w-4 mr-2" />
              Quests
            </TabsTrigger>
            <TabsTrigger value="arena" className="data-[state=active]:bg-purple-700">
              <Trophy className="h-4 w-4 mr-2" />
              Arena
            </TabsTrigger>
            <TabsTrigger value="social" className="data-[state=active]:bg-purple-700">
              <Users className="h-4 w-4 mr-2" />
              Social
            </TabsTrigger>
          </TabsList>

          <div className="hidden md:block">
            <Badge variant="outline" className="bg-purple-900/50 text-purple-200 border-purple-500 px-3 py-1">
              <Clock className="h-4 w-4 mr-2" />
              Season 2 ends in 14d 6h
            </Badge>
          </div>
        </div>

        <TabsContent value="battles" className="mt-0 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-purple-700 overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <Sword className="h-5 w-5 mr-2 text-red-400" />
                  Time Rift Battle
                </CardTitle>
                <CardDescription>Challenge the time guardians</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative h-40 w-full rounded-md overflow-hidden mb-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 to-indigo-900/80 flex items-center justify-center">
                    <div className="text-center">
                      <Sparkles className="h-12 w-12 mx-auto text-purple-300 animate-pulse" />
                      <p className="text-lg font-bold mt-2">Time Rift Portal</p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <div className="flex items-center">
                    <Zap className="h-4 w-4 mr-1 text-yellow-400" />
                    <span>Energy: 5/10</span>
                  </div>
                  <div>
                    <span className="text-green-400">+25 XP</span> | <span className="text-yellow-400">+50 Coins</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  onClick={handleBattle}
                >
                  Start Battle
                </Button>
              </CardFooter>
            </Card>

            <GameCard
              title="Chronos Challenge"
              description="Race against the clock"
              icon={<Clock className="h-5 w-5 mr-2 text-blue-400" />}
              rewards={{ xp: 40, coins: 75 }}
              energy={7}
              maxEnergy={10}
              buttonText="Enter Challenge"
              onAction={() => {
                increaseXP(40)
                increaseCoins(75)
              }}
            />

            <GameCard
              title="Time Warp Duel"
              description="Battle in distorted time"
              icon={<Shield className="h-5 w-5 mr-2 text-green-400" />}
              rewards={{ xp: 60, coins: 100 }}
              energy={3}
              maxEnergy={10}
              buttonText="Start Duel"
              onAction={() => {
                increaseXP(60)
                increaseCoins(100)
              }}
              locked={true}
              lockedReason="Unlock at Level 5"
            />
          </div>

          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-purple-700">
            <CardHeader>
              <CardTitle>Battle Pass - Season 2</CardTitle>
              <CardDescription>Complete battles to earn rewards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Battle Pass Level 3</span>
                    <span>450/1000 XP</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2.5 rounded-full"
                      style={{ width: "45%" }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`relative border rounded-md p-2 flex flex-col items-center ${
                        level <= 3 ? "border-purple-500 bg-purple-900/30" : "border-gray-700 bg-gray-800/50"
                      }`}
                    >
                      <span className="text-xs font-bold mb-1">Level {level}</span>
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          level <= 3 ? "bg-purple-700" : "bg-gray-700"
                        }`}
                      >
                        {level === 1 && <Coins className="h-5 w-5 text-yellow-400" />}
                        {level === 2 && <Sword className="h-5 w-5 text-red-400" />}
                        {level === 3 && <Shield className="h-5 w-5 text-blue-400" />}
                        {level === 4 && <Zap className="h-5 w-5 text-yellow-400" />}
                        {level === 5 && <Trophy className="h-5 w-5 text-yellow-400" />}
                      </div>
                      {level <= 3 && (
                        <div className="absolute -top-2 -right-2 bg-green-500 rounded-full w-5 h-5 flex items-center justify-center">
                          <span className="text-xs">✓</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quests" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <QuestCard
              title="Time Traveler's Dilemma"
              description="Solve the paradox before time runs out"
              difficulty="Medium"
              rewards={{ xp: 75, coins: 120 }}
              progress={30}
              timeLeft="2h 15m"
            />

            <QuestCard
              title="Chronos Artifacts"
              description="Collect the lost artifacts of time"
              difficulty="Hard"
              rewards={{ xp: 150, coins: 200 }}
              progress={0}
              status="not-started"
            />

            <QuestCard
              title="Guardian's Trial"
              description="Prove your worth to the Time Guardians"
              difficulty="Easy"
              rewards={{ xp: 50, coins: 80 }}
              progress={100}
              status="completed"
            />

            <QuestCard
              title="Temporal Anomaly"
              description="Investigate the strange time distortions"
              difficulty="Medium"
              rewards={{ xp: 100, coins: 150 }}
              progress={65}
              timeLeft="4h 30m"
            />
          </div>
        </TabsContent>

        <TabsContent value="arena" className="mt-0">
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-purple-700">
            <CardHeader>
              <CardTitle>Arena Rankings</CardTitle>
              <CardDescription>Compete against other players</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-r from-yellow-500 to-amber-500 w-12 h-12 rounded-full flex items-center justify-center text-black font-bold text-lg">
                      #1
                    </div>
                    <div>
                      <p className="font-bold">TimeWizard</p>
                      <p className="text-sm text-gray-400">Level 42 • 1250 points</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Challenge
                  </Button>
                </div>

                {[
                  { rank: 2, name: "ChronoMaster", level: 38, points: 1180 },
                  { rank: 3, name: "TemporalKnight", level: 35, points: 1120 },
                  { rank: 4, name: "TimeBender", level: 33, points: 1050 },
                  { rank: 5, name: "ClockworkSage", level: 30, points: 980 },
                ].map((player) => (
                  <div key={player.rank} className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                          player.rank === 2
                            ? "bg-gradient-to-r from-gray-300 to-gray-400 text-black"
                            : player.rank === 3
                              ? "bg-gradient-to-r from-amber-700 to-amber-800 text-white"
                              : "bg-gray-700"
                        }`}
                      >
                        #{player.rank}
                      </div>
                      <div>
                        <p className="font-bold">{player.name}</p>
                        <p className="text-sm text-gray-400">
                          Level {player.level} • {player.points} points
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Challenge
                    </Button>
                  </div>
                ))}

                <div className="flex justify-between items-center bg-purple-900/30 p-3 rounded-lg border border-purple-700">
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-700 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg">
                      #28
                    </div>
                    <div>
                      <p className="font-bold">You</p>
                      <p className="text-sm text-gray-400">Level 1 • 120 points</p>
                    </div>
                  </div>
                  <Button variant="default" size="sm" className="bg-purple-600 hover:bg-purple-700">
                    Climb Ranks
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-purple-700 col-span-1 md:col-span-2">
              <CardHeader>
                <CardTitle>Friends</CardTitle>
                <CardDescription>Your time-traveling companions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "TimeWizard", level: 42, status: "online", lastActive: "Now" },
                    { name: "ChronoMaster", level: 38, status: "online", lastActive: "Now" },
                    { name: "TemporalKnight", level: 35, status: "offline", lastActive: "2h ago" },
                    { name: "ClockworkSage", level: 30, status: "offline", lastActive: "1d ago" },
                  ].map((friend, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center">
                            {friend.name.charAt(0)}
                          </div>
                          <div
                            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-800 ${
                              friend.status === "online" ? "bg-green-500" : "bg-gray-500"
                            }`}
                          ></div>
                        </div>
                        <div>
                          <p className="font-medium">{friend.name}</p>
                          <p className="text-xs text-gray-400">
                            Level {friend.level} • {friend.lastActive}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Message
                        </Button>
                        <Button variant="outline" size="sm">
                          Challenge
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Find More Friends
                </Button>
              </CardFooter>
            </Card>

            <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-purple-700">
              <CardHeader>
                <CardTitle>Guilds</CardTitle>
                <CardDescription>Join forces with other time warriors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border border-purple-700 rounded-lg p-4 bg-purple-900/20">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-700 flex items-center justify-center">
                        <Clock className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-bold">Temporal Guardians</h4>
                        <p className="text-xs text-gray-400">42 members • Level 15 Guild</p>
                      </div>
                    </div>
                    <p className="text-sm mb-3">Protectors of the timeline, masters of chronos magic.</p>
                    <Button className="w-full">Join Guild</Button>
                  </div>

                  <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/50">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-700 flex items-center justify-center">
                        <Sword className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-bold">Chrono Crusaders</h4>
                        <p className="text-xs text-gray-400">28 members • Level 12 Guild</p>
                      </div>
                    </div>
                    <p className="text-sm mb-3">Warriors who fight across time and space.</p>
                    <Button variant="outline" className="w-full">
                      View Guild
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
