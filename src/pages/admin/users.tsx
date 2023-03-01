import React, { useState, useRef, useCallback, useMemo } from "react";
import axios from "@/utils/axios";
import ReactTable, { ReactTableRef } from "@/components/ReactTable";
import UserEditModal from "@/components/UserEditModal";
import {
  CellContext,
  ColumnDef,
  ColumnFiltersState,
  createColumnHelper,
  SortingState,
} from "@tanstack/react-table";
import User from "@/types/user";
import {
  Alert,
  Box,
  Button,
  Flex,
  Heading,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import { DeleteIcon, EditIcon } from "@chakra-ui/icons";
import mongoose from "mongoose";
import { ApiDataResponse } from "@/types/api";
import { handleReactApiError } from "@/utils/react";
import { FeedbackAlert } from "@/components/FeedbackAlert";

export default function UserPage() {
  const [errorMessage, setErrorMessage] = useState<string[]>([]);

  const tableRef = useRef<ReactTableRef>(null);
  const [data, setData] = useState<
    mongoose.PaginateResult<User> | { docs: User[]; totalPages: number }
  >({ docs: [], totalPages: 0 });

  const [userId, setUserId] = useState(null);

  const { isOpen, onClose, onOpen } = useDisclosure();

  const closeModalCB = useCallback(() => {
    if (tableRef.current) {
      onClose();
      tableRef.current.refreshTable();
      setUserId(null);
    }
  }, [onClose]);

  const deleteUser = useCallback(async (userId: string) => {
    try {
      await axios.delete(`/api/admin/users/${userId}`);
      tableRef.current && tableRef.current.refreshTable();
    } catch (e) {
      handleReactApiError(e, setErrorMessage);
    }
  }, []);

  const actionsCell = useCallback(
    (cell: CellContext<User, any>) => {
      return (
        <Box>
          <EditIcon
            me="4"
            cursor="pointer"
            onClick={() => {
              setUserId(cell.getValue());
              onOpen();
            }}
          />
          <DeleteIcon
            cursor="pointer"
            onClick={() => {
              if (window.confirm("Are you sure?")) {
                deleteUser(cell.getValue());
              }
            }}
          />
        </Box>
      );
    },
    [deleteUser, onOpen]
  );

  const columnHelper = createColumnHelper<User>();

  const columns: Array<ColumnDef<User, any>> = useMemo<
    Array<ColumnDef<User, any>>
  >(() => {
    return [
      columnHelper.accessor("_id", {
        header: "Actions",
        enableColumnFilter: false,
        cell: actionsCell,
      }),
      columnHelper.accessor("username", {
        header: "Username",
      }),
      columnHelper.accessor("name", {
        header: "Name",
      }),
      columnHelper.accessor("email", {
        header: "E-mail",
      }),
      columnHelper.accessor("verified", {
        header: "Verified",
        enableColumnFilter: false,
      }),
      columnHelper.accessor("role", {
        header: "Role",
      }),
      columnHelper.accessor("createdAt", {
        header: "Created At",
        enableColumnFilter: false,
        cell: (cell) => new Date(cell.getValue()).toLocaleString(),
      }),
      columnHelper.accessor("updatedAt", {
        header: "Updated At",
        enableColumnFilter: false,
        cell: (cell) => new Date(cell.getValue()).toLocaleString(),
      }),
    ];
  }, [actionsCell, columnHelper]);

  const fetchData = useCallback(
    async (
      pageIndex: number,
      pageSize: number,
      sortBy: SortingState,
      filters: ColumnFiltersState
    ) => {
      try {
        const response = await axios.get("/api/admin/users", {
          params: {
            page: pageIndex + 1,
            limit: pageSize,
            sort: sortBy.map((sort) => sort.id),
            order: sortBy.map((sort) => sort.desc),
            filterId: filters.map((filter) => filter.id),
            filterValue: filters.map((filter) => filter.value),
          },
        });

        const data = response.data as ApiDataResponse<
          mongoose.PaginateResult<User>
        >;

        setData(data.data);
      } catch (e) {
        handleReactApiError(e, setErrorMessage);
      }
    },
    []
  );

  return (
    <>
      <Flex
        direction="column"
        bg={useColorModeValue("gray.100", "gray.900")}
        alignContent="center"
      >
        <Box
          borderRadius="lg"
          m={{ base: 5, md: 16, lg: 10 }}
          p={{ base: 5, lg: 16 }}
          backgroundColor="white"
        >
          <Heading textAlign="center">Users</Heading>
          <FeedbackAlert errorMessage={errorMessage} />
          <Button
            type="button"
            size="sm"
            mb="4"
            onClick={() => {
              setUserId(null);
              onOpen();
            }}
            w="100px"
          >
            New
          </Button>
          <ReactTable
            ref={tableRef}
            columns={columns}
            data={data}
            fetchData={fetchData}
          />
        </Box>
      </Flex>
      <UserEditModal isOpen={isOpen} onClose={closeModalCB} userId={userId} />
    </>
  );
}
