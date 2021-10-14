import { Modal, Form, Input } from "antd";
import { useForm } from "antd/lib/form/Form";
import { ModelType } from "graphql-ts-client-api";
import { FC, memo, useCallback, useEffect } from "react";
import UUIDClass from "uuidjs";
import { book$, bookStore$$ } from "../../../__generated/fetchers";
import { stateManager } from "../App";
import { BookMultiSelect } from "../book/BookMutliSelect";
import { INFORMATION_CLASS, PSEUDO_CODE_CLASS } from "../Css";

const BOOK_STORE_EDIT_INFO =
    bookStore$$
    .books(
        book$.id
    );

type BookStoreInput = ModelType<typeof bookStore$$> & {
    readonly bookIds: readonly string[];
}

export const BookStoreDialog: FC<{
    value?: ModelType<typeof BOOK_STORE_EDIT_INFO>,
    onClose: (value?: ModelType<typeof BOOK_STORE_EDIT_INFO>) => void
}> = memo(({value, onClose}) => {

    const [form] = useForm<BookStoreInput>();

    useEffect(() => {
        form.setFieldsValue({
            id: value?.id ?? UUIDClass.generate(),
            name: value?.name ?? "",
            bookIds: value?.books.map(book => book.id) ?? []
        })
    }, [form, value]);

    const onOk = useCallback(() => {
        const input = form.getFieldsValue();
        const info: ModelType<typeof BOOK_STORE_EDIT_INFO> = {
            id: input.id,
            name: input.name,
            books: input.bookIds.map(bookId => ({id: bookId}))
        };
        if (info.id === undefined) {
            throw new Error();
        }
        stateManager.save(BOOK_STORE_EDIT_INFO, info);
        onClose(info);
    }, [form, onClose]);

    const onCancel = useCallback(() => {
        onClose();
    }, [onClose]);

    return (
        <Modal 
        visible={true}
        title={`${value === undefined ? 'Create' : 'Edit'} BookStore`}
        onOk={onOk}
        onCancel={onCancel}
        width={1000}>
            <Form form={form} labelCol={{span: 8}} wrapperCol={{span: 16}}>
                <Form.Item name="id" hidden={true}/>
                <Form.Item label="Name" name="name">
                    <Input autoComplete="off"/>
                </Form.Item>
                <Form.Item label="Books" name="bookIds">
                    <BookMultiSelect/>
                </Form.Item>
                {BOOKS_DESCRIPTION_ITEM}
            </Form>
        </Modal>
    );
});

const FOR_REMOVED_BOOK = `
removedBook.store = undefined;
`;

const FOR_ADDED_BOOK = `
addBook.store = this;

const anotherStore = addedBook.store;
if (anotherStore !== undefined && cached(annotherStore.books)) {
    annotherStore.books.remove(addedBook);
}
`;

const BOOKS_DESCRIPTION_ITEM = (
    <Form.Item label=" " colon={false}>
        <div className={INFORMATION_CLASS}>
            If you change this association "Store.books"
            <ul>
                <li>
                    For each removed book, this action will be executed automatically
                    <pre className={PSEUDO_CODE_CLASS}>{FOR_REMOVED_BOOK}</pre>
                </li>
                <li>
                    For each added book, this action will be executed automatically
                    <pre  className={PSEUDO_CODE_CLASS}>{FOR_ADDED_BOOK}</pre>
                </li>
            </ul>
        </div>
    </Form.Item>
);