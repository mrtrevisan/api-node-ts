import { RowDataPacket } from 'mysql2/promise';

export interface DbRows extends RowDataPacket {
    property1? : number
    property2? : string
}