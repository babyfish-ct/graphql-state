import { Modal, Form, Input } from "antd";
import { useForm } from "antd/lib/form/Form";
import { ModelType } from "graphql-ts-client-api";
import { FC, memo, useCallback, useEffect } from "react";
import UUIDClass from "uuidjs";
import { author$$, book$ } from "../../../__generated/fetchers";
import { stateManager } from "../App";
import { BookMultiSelect } from "../book/BookMutliSelect";
import { INFORMATION_CLASS, PSEUDO_CODE_CLASS } from "../Css";

const AUTHOR_EDIT_INFO =
    author$$
    .books(book$.id)
;

type AuthorInput = ModelType<typeof author$$> & {
    readonly bookIds: string[]
};

export const AuthorDialog: FC<{
    value?: ModelType<typeof AUTHOR_EDIT_INFO>,
    onClose: (value?: ModelType<typeof AUTHOR_EDIT_INFO>) => void
}> = memo(({value, onClose}) => {

    const [form] = useForm<AuthorInput>();

    useEffect(() => {
        form.setFieldsValue({
            id: value?.id ?? UUIDClass.generate(),
            name: value?.name ?? "",
            bookIds: value?.books?.map(book => book.id) ?? []
        })
    }, [form, value]);

    const onOk = useCallback(() => {
        const input = form.getFieldsValue();
        const info: ModelType<typeof AUTHOR_EDIT_INFO> = {
            id: input.id,
            name: input.name,
            books: input.bookIds.map(bookId => ({id: bookId}))
        };
        if (info.id === undefined) {
            throw new Error();
        }
        stateManager.save(AUTHOR_EDIT_INFO, info);
        onClose(info);
    }, [form, onClose]);

    const onCancel = useCallback(() => {
        onClose();
    }, [onClose]);

    return (
        <Modal
        visible={true}
        title={`${value === undefined ? 'Create' : 'Edit'} Author`}
        onOk={onOk}
        onCancel={onCancel}
        width={1000}>
            <Form form={form}  labelCol={{span: 8}} wrapperCol={{span: 16}}>
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
if (cached(removeBook.authors)) {
    removeBook.authors.add(this);
}`;

const FOR_ADDED_BOOK = `
if (cached(addedBook.authors)) {
    addedBook.authors.add(this);
}`;

const BOOKS_DESCRIPTION_ITEM = (
    <Form.Item label=" " colon={false}>
        <div className={INFORMATION_CLASS}>
            If you change this association "Author.books"
            <ul>
                <li>
                    For old store, this behavior will be executed automatically
                    <pre className={PSEUDO_CODE_CLASS}>{FOR_REMOVED_BOOK}</pre>
                </li>
                <li>
                    For new store, this behavior will be executed automatically
                    <pre className={PSEUDO_CODE_CLASS}>{FOR_ADDED_BOOK}</pre>
                </li>
            </ul>
        </div>
    </Form.Item>
);