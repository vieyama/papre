import 'server-only';

import { cache } from 'react';
import { makeQueryClient } from '@/lib/react-query';

export const getQueryClient = cache(makeQueryClient);
