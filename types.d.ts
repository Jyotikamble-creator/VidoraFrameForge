import { Connection } from "mongoose";

// global variable declariton for connection
declare global{
    var mongoose:{
        conn: Connection | null
        promise: Promise<Connection> | null
    }
}

export {}

