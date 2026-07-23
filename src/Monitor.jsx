import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import './Monitor.css'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Legend
} from 'recharts'

function Monitor() {

    const [user, setUser] = useState(null)
    const [checkingUser, setCheckingUser] = useState(true)

    const [range, setRange] = useState("all")
    const [printSources, setPrintSources] = useState([])
    const [printSource, setPrintSource] = useState("all")

    const [chartData, setChartData] = useState([])


    const [total, setTotal] = useState(null)
    const [printed, setPrinted] = useState(null)
    const [pending, setPending] = useState(null)
    const [expired, setExpired] = useState(null)
    const [storageFiles, setStorageFiles] = useState(null)
    const [loadingData, setLoadingData] = useState(true)
    const [loadingTotal, setLoadingTotal] = useState(true)
    const [loadingPrinted, setLoadingPrinted] = useState(true)



    const loadPrintSources = async () => {

        const { data, error } = await supabase
            .from('submissions')
            .select('printed_from')
            .not('printed_from', 'is', null)

        if (error) {
            console.error(
                "Load print sources error:",
                error
            )
            return
        }


        const uniqueSources = [
            ...new Set(
                data.map(item => item.printed_from)
            )
        ]


        setPrintSources(uniqueSources)

    }

    useEffect(() => {

        const checkUser = async () => {

            const {
                data,
                error
            } = await supabase.auth.getUser()

            if (error) {
                console.error(error)
                window.location.href = "/monitor-login"
                return
            }

            if (!data.user) {
                window.location.href = "/monitor-login"
                return
            }

            setUser(data.user)

            await loadPrintSources()

            setCheckingUser(false)
        }


        checkUser()

    }, [])

    useEffect(() => {
        if (user) {
            loadTotalUploads()
        }
    }, [range, user])


    useEffect(() => {
        if (user) {
            loadPrinted()
        }
    }, [range, printSource, user])

    useEffect(() => {
        if (user) {
            loadData()
        }
    }, [user])

    const loadPrinted = async () => {
        setLoadingPrinted(true)

        const now = new Date()

        let query = supabase
            .from('submissions')
            .select('*', {
                count: 'exact',
                head: true
            })
            .eq(
                'status',
                'Printed'
            )


        if (printSource !== "all") {

            query = query.eq(
                'printed_from',
                printSource
            )

        }


        if (range === "today") {

            const start = new Date()
            start.setHours(0, 0, 0, 0)

            query = query.gte(
                'printed_date',
                start.toISOString()
            )

        }


        if (range === "7days") {

            const now = new Date()
            const start = new Date()
            start.setDate(now.getDate() - 7)

            query = query.gte(
                'printed_date',
                start.toISOString()
            )

        }


        if (range === "30days") {

            const now = new Date()
            const start = new Date()
            start.setDate(now.getDate() - 30)

            query = query.gte(
                'printed_date',
                start.toISOString()
            )

        }


        if (range === "month") {

            const start = new Date(
                now.getFullYear(),
                now.getMonth(),
                1
            )

            query = query.gte(
                'printed_date',
                start.toISOString()
            )

        }


        if (range === "lastMonth") {

            const start = new Date(
                now.getFullYear(),
                now.getMonth() - 1,
                1
            )

            const end = new Date(
                now.getFullYear(),
                now.getMonth(),
                1
            )

            query = query
                .gte(
                    'printed_date',
                    start.toISOString()
                )
                .lt(
                    'printed_date',
                    end.toISOString()
                )

        }


        const { count, error } = await query


        if (error) {
            console.error(error)
            setLoadingPrinted(false)
            return
        }

        setPrinted(count || 0)
        setLoadingPrinted(false)
    }

    const loadChartData = async () => {

        let query = supabase
            .from('submissions')
            .select('created_at, printed_date, status, printed_from')


        if (printSource !== "all") {
            query = query.eq(
                'printed_from',
                printSource
            )
        }


        const { data, error } = await query


        if (error) {
            console.error(error)
            return
        }


        const grouped = {}


        data.forEach(item => {

            const uploadDate = new Date(
                item.created_at
            ).toLocaleDateString()


            if (!grouped[uploadDate]) {
                grouped[uploadDate] = {
                    date: uploadDate,
                    uploads: 0,
                    printed: 0
                }
            }


            grouped[uploadDate].uploads++


            if (item.status === "Printed" && item.printed_date) {

                const printedDate = new Date(
                    item.printed_date
                ).toLocaleDateString()


                if (!grouped[printedDate]) {
                    grouped[printedDate] = {
                        date: printedDate,
                        uploads: 0,
                        printed: 0
                    }
                }


                grouped[printedDate].printed++

            }

        })


        setChartData(
            Object.values(grouped)
        )

    }

    useEffect(() => {

        if (user) {
            loadChartData()
        }

    }, [range, printSource, user])

    const loadTotalUploads = async () => {

        setLoadingTotal(true)

        let query = supabase
            .from('submissions')
            .select('*', {
                count: 'exact',
                head: true
            })


        if (range === "today") {

            const start = new Date()
            start.setHours(0, 0, 0, 0)

            query = query.gte(
                'created_at',
                start.toISOString()
            )

        }


        if (range === "7days") {

            const start = new Date()
            start.setDate(new Date().getDate() - 7)

            query = query.gte(
                'created_at',
                start.toISOString()
            )

        }


        if (range === "30days") {

            const start = new Date()
            start.setDate(new Date().getDate() - 30)

            query = query.gte(
                'created_at',
                start.toISOString()
            )

        }


        if (range === "month") {

            const now = new Date()

            const start = new Date(
                now.getFullYear(),
                now.getMonth(),
                1
            )

            query = query.gte(
                'created_at',
                start.toISOString()
            )

        }


        if (range === "lastMonth") {

            const now = new Date()

            const start = new Date(
                now.getFullYear(),
                now.getMonth() - 1,
                1
            )

            const end = new Date(
                now.getFullYear(),
                now.getMonth(),
                1
            )


            query = query
                .gte(
                    'created_at',
                    start.toISOString()
                )
                .lt(
                    'created_at',
                    end.toISOString()
                )

        }


        const { count, error } = await query


        if (error) {
            console.error(error)
            setLoadingTotal(false)
            return
        }


        setTotal(count || 0)

        setLoadingTotal(false)

    }

    const loadData = async () => {

        setLoadingData(true)

        // Pending and Expired ignore filters
        const getSystemStatusCount = async (status) => {

            const { count } = await supabase
                .from('submissions')
                .select('*', {
                    count: 'exact',
                    head: true
                })
                .eq(
                    'status',
                    status
                )

            return count || 0

        }


        setPending(await getSystemStatusCount("Pending"))
        setExpired(await getSystemStatusCount("Expired"))

        const countStorageFiles = async () => {

            const folders = [
                "ic-front",
                "ic-back",
                "bank-slip"
            ]

            let totalFiles = 0

            for (const folder of folders) {

                const { data, error } = await supabase.storage
                    .from('uploads')
                    .list(folder, {
                        limit: 1000
                    })

                if (error) {
                    console.error(
                        "Storage count error:",
                        error
                    )
                    continue
                }

                totalFiles += data.length
            }

            return totalFiles
        }


        const files = await countStorageFiles()

        setStorageFiles(files)

        setLoadingData(false)

    }

    if (checkingUser) {
        return (
            <div className="monitor-loading">
                Checking login...
            </div>
        )
    }

    const logout = async () => {

        await supabase.auth.signOut()

        window.location.href = "/monitor-login"

    }

    return (
        <div className="monitor-page">

            <div className="monitor-header">

                <div>
                    <h1>
                        Kiosk Monitor
                    </h1>

                    <p>
                        {user.email}
                    </p>
                </div>


                <div className="monitor-actions">

                    <button
                        className="logout-button"
                        onClick={logout}
                    >
                        Logout
                    </button>

                </div>

            </div>





            <div className="dashboard-grid">


                <div className="monitor-card">

                    <h2>
                        Storage Files
                    </h2>

                    <p>
                        {loadingData ? "Loading..." : storageFiles}
                    </p>

                </div>


                <div className="monitor-card">

                    <h2>
                        Pending
                    </h2>

                    <p>
                        {loadingData ? "Loading..." : pending}
                    </p>

                </div>


                <div className="monitor-card">

                    <h2>
                        Expired Uploads
                    </h2>

                    <p>
                        {loadingData ? "Loading..." : expired}
                    </p>

                </div>


            </div>


            <div className="monitor-filter-row">

                <select
                    className="filter-select"
                    value={range}
                    onChange={(e) => setRange(e.target.value)}
                >
                    <option value="today">
                        Today
                    </option>

                    <option value="7days">
                        Last 7 Days
                    </option>

                    <option value="30days">
                        Last 30 Days
                    </option>

                    <option value="month">
                        This Month
                    </option>

                    <option value="lastMonth">
                        Last Month
                    </option>

                    <option value="all">
                        All Time
                    </option>

                </select>

            </div>


            <div className="dashboard-grid second-row">

                <div className="monitor-card">

                    <h2>
                        Total Uploads
                    </h2>

                    <p>
                        {loadingTotal ? "Loading..." : total}
                    </p>

                </div>


                <div className="monitor-card printed-card">

                    <div className="card-title-row">

                        <h2>
                            Total Printed From
                        </h2>


                        <select
                            className="filter-select"
                            value={printSource}
                            onChange={(e) => setPrintSource(e.target.value)}
                        >

                            <option value="all">
                                All Sources
                            </option>

                            {
                                printSources.map((source) => (
                                    <option
                                        key={source}
                                        value={source}
                                    >
                                        {source}
                                    </option>
                                ))
                            }

                        </select>

                    </div>


                    <p>
                        {loadingPrinted ? "Loading..." : printed}
                    </p>

                </div>

            </div>

            <div className="monitor-card chart-card">

                <h2>
                    Upload vs Printed
                </h2>


                <ResponsiveContainer
                    width="100%"
                    height={300}
                >

                    <LineChart
                        data={chartData}
                    >

                        <CartesianGrid />

                        <XAxis
                            dataKey="date"
                        />

                        <YAxis />

                        <Tooltip />

                        <Legend />


                        <Line
                            type="monotone"
                            dataKey="uploads"
                            name="Total Uploads"
                        />


                        <Line
                            type="monotone"
                            dataKey="printed"
                            name="Total Printed"
                        />

                    </LineChart>

                </ResponsiveContainer>

            </div>

        </div>

    )
}

export default Monitor