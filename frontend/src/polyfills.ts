import { Buffer } from 'buffer';
import process from 'process';

(window as any).global = window;
(window as any).Buffer = (window as any).Buffer || Buffer;
(window as any).process = process;
