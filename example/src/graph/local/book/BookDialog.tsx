import { Modal, Form, Input } from "antd";
import { useForm } from "antd/lib/form/Form";
import { ModelType } from "graphql-ts-client-api";
import { FC, memo, useCallback, useEffect } from "react";
import UUIDClass from "uuidjs";
import { author$, book$$, bookStore$ } from "../../../__generated/fetchers";
import { stateManager } from "../App";
import { AuthorMultiSelect } from "../author/AuthorMultiSelect";
import { BookStoreSelect } from "../store/BookStoreSelect";

const BOOK_EDIT_INFO =
    book$$
    .store(bookStore$.id)
    .authors(author$.id)
;

type BookInput = ModelType<typeof book$$> & {
    readonly storeId?: string;
    readonly authorIds: readonly string[];
}

export const BookDialog: FC<{
    value?: ModelType<typeof BOOK_EDIT_INFO>,
    onClose: (value?: ModelType<typeof BOOK_EDIT_INFO>) => void
}> = memo(({value, onClose}) => {

    const [form] = useForm<BookInput>();

    useEffect(() => {
        form.setFieldsValue({
            id: value?.id ?? UUIDClass.generate(),
            name: value?.name ?? "",
            storeId: value?.store?.id,
            authorIds: value?.authors.map(author => author.id) ?? []
        })
    }, [form, value]);

    const onOk = useCallback(() => {
        const input = form.getFieldsValue();
        const info: ModelType<typeof BOOK_EDIT_INFO> = {
            id: input.id,
            name: input.name,
            store: input.storeId !== undefined ? {id: input.storeId} : undefined,
            authors: input.authorIds.map(authorId => ({id: authorId}))
        };
        if (info.id === undefined) {
            throw new Error();
        }
        stateManager.save(BOOK_EDIT_INFO, info);
        onClose(info);
    }, [form, onClose]);

    const onCancel = useCallback(() => {
        onClose();
    }, [onClose]);

    return (
        <Modal
        visible={true}
        title={`${value === undefined ? 'Create' : 'Edit'} Book`}
        onOk={onOk}
        onCancel={onCancel}>
            <Form form={form} labelCol={{span: 8}} wrapperCol={{span: 16}}>
                <Form.Item name="id" hidden={true}/>
                <Form.Item label="Name" name="name">
                    <Input autoComplete="off"/>
                </Form.Item>
                <Form.Item label="Store" name="storeId">
                    <BookStoreSelect optional={true}/>
                </Form.Item>
                <Form.Item label="Authors" name="authorIds">
                    <AuthorMultiSelect/>
                </Form.Item>
            </Form>
        </Modal>
    );
});