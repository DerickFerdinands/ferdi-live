"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/components/providers/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Clock, Plus, Trash2, Edit, Tv } from "lucide-react"
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface ProgramSchedule {
    id: string
    startTime: Date
    endTime: Date
    liveChannelId: string
    programmeId: string
    title: string
    description?: string
    createdAt: Date
}

interface ProgramScheduleProps {
    channelId: string
    channelName: string
}

export function ProgramSchedule({ channelId, channelName }: ProgramScheduleProps) {
    const { user } = useAuth()
    const { toast } = useToast()
    const [schedules, setSchedules] = useState<ProgramSchedule[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingSchedule, setEditingSchedule] = useState<ProgramSchedule | null>(null)
    const [formData, setFormData] = useState({
        startTime: "",
        endTime: "",
        programmeId: "",
        title: "",
        description: "",
    })

    useEffect(() => {
        const q = query(collection(db, "programSchedules"), where("liveChannelId", "==", channelId))

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const scheduleData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                startTime: doc.data().startTime?.toDate() || new Date(),
                endTime: doc.data().endTime?.toDate() || new Date(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
            })) as ProgramSchedule[]

            // Sort by start time
            scheduleData.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
            setSchedules(scheduleData)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [channelId])

    const resetForm = () => {
        setFormData({
            startTime: "",
            endTime: "",
            programmeId: "",
            title: "",
            description: "",
        })
        setEditingSchedule(null)
    }

    const openEditDialog = (schedule: ProgramSchedule) => {
        setEditingSchedule(schedule)
        setFormData({
            startTime: schedule.startTime.toISOString().slice(0, 16),
            endTime: schedule.endTime.toISOString().slice(0, 16),
            programmeId: schedule.programmeId,
            title: schedule.title,
            description: schedule.description || "",
        })
        setDialogOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !formData.startTime || !formData.endTime || !formData.title) return

        try {
            const startTime = new Date(formData.startTime)
            const endTime = new Date(formData.endTime)

            if (endTime <= startTime) {
                toast({
                    title: "Invalid Time Range",
                    description: "End time must be after start time.",
                    variant: "destructive",
                })
                return
            }

            const scheduleData = {
                startTime,
                endTime,
                liveChannelId: channelId,
                programmeId: formData.programmeId || `prog_${Date.now()}`,
                title: formData.title,
                description: formData.description,
                updatedAt: new Date(),
            }

            if (editingSchedule) {
                // Update existing schedule
                await updateDoc(doc(db, "programSchedules", editingSchedule.id), scheduleData)
                toast({
                    title: "Schedule Updated",
                    description: "Program schedule has been updated successfully.",
                })
            } else {
                // Create new schedule
                await addDoc(collection(db, "programSchedules"), {
                    ...scheduleData,
                    createdAt: new Date(),
                })
                toast({
                    title: "Schedule Created",
                    description: "Program schedule has been added successfully.",
                })
            }

            setDialogOpen(false)
            resetForm()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to save program schedule.",
                variant: "destructive",
            })
        }
    }

    const deleteSchedule = async (scheduleId: string) => {
        try {
            await deleteDoc(doc(db, "programSchedules", scheduleId))
            toast({
                title: "Schedule Deleted",
                description: "Program schedule has been deleted successfully.",
            })
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete program schedule.",
                variant: "destructive",
            })
        }
    }

    const formatDateTime = (date: Date) => {
        return date.toLocaleString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const getDuration = (start: Date, end: Date) => {
        const diffMs = end.getTime() - start.getTime()
        const diffMins = Math.floor(diffMs / (1000 * 60))
        const hours = Math.floor(diffMins / 60)
        const minutes = diffMins % 60
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
    }

    const getScheduleStatus = (schedule: ProgramSchedule) => {
        const now = new Date()
        if (now < schedule.startTime) return "upcoming"
        if (now >= schedule.startTime && now <= schedule.endTime) return "live"
        return "ended"
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "live":
                return <Badge className="bg-red-500">Live</Badge>
            case "upcoming":
                return <Badge variant="secondary">Upcoming</Badge>
            case "ended":
                return <Badge variant="outline">Ended</Badge>
            default:
                return <Badge variant="outline">Unknown</Badge>
        }
    }

    if (loading) {
        return <div className="p-4">Loading program schedule...</div>
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Program Schedule
                        </CardTitle>
                        <CardDescription>Manage catch-up TV program schedule for {channelName}</CardDescription>
                    </div>
                    <Dialog
                        open={dialogOpen}
                        onOpenChange={(open) => {
                            setDialogOpen(open)
                            if (!open) resetForm()
                        }}
                    >
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Program
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingSchedule ? "Edit Program" : "Add Program"}</DialogTitle>
                                <DialogDescription>
                                    {editingSchedule ? "Update the program details" : "Schedule a new program for catch-up TV"}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="startTime">Start Time</Label>
                                        <Input
                                            id="startTime"
                                            type="datetime-local"
                                            value={formData.startTime}
                                            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="endTime">End Time</Label>
                                        <Input
                                            id="endTime"
                                            type="datetime-local"
                                            value={formData.endTime}
                                            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="programmeId">Programme ID</Label>
                                    <Input
                                        id="programmeId"
                                        value={formData.programmeId}
                                        onChange={(e) => setFormData({ ...formData, programmeId: e.target.value })}
                                        placeholder="e.g., PROG001 (auto-generated if empty)"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="title">Title</Label>
                                    <Input
                                        id="title"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Program title"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Program description (optional)"
                                        rows={3}
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <Button type="submit" className="flex-1">
                                        {editingSchedule ? "Update Program" : "Add Program"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setDialogOpen(false)
                                            resetForm()
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                {schedules.length === 0 ? (
                    <Alert>
                        <Tv className="h-4 w-4" />
                        <AlertDescription>
                            No programs scheduled yet. Add your first program to enable catch-up TV functionality.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <div className="space-y-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Program</TableHead>
                                    <TableHead>Start Time</TableHead>
                                    <TableHead>End Time</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Programme ID</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {schedules.map((schedule) => (
                                    <TableRow key={schedule.id}>
                                        <TableCell>{getStatusBadge(getScheduleStatus(schedule))}</TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{schedule.title}</div>
                                                {schedule.description && (
                                                    <div className="text-sm text-gray-500 truncate max-w-xs">{schedule.description}</div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">{formatDateTime(schedule.startTime)}</TableCell>
                                        <TableCell className="text-sm">{formatDateTime(schedule.endTime)}</TableCell>
                                        <TableCell className="text-sm">{getDuration(schedule.startTime, schedule.endTime)}</TableCell>
                                        <TableCell className="font-mono text-xs">{schedule.programmeId}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button size="sm" variant="outline" onClick={() => openEditDialog(schedule)}>
                                                    <Edit className="h-3 w-3" />
                                                </Button>
                                                <Button size="sm" variant="destructive" onClick={() => deleteSchedule(schedule.id)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        <Alert>
                            <Clock className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                                <strong>Note:</strong> Programs are automatically available for catch-up viewing based on your channel's
                                catch-up duration setting. Live programs are highlighted in red.
                            </AlertDescription>
                        </Alert>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
